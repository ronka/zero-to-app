import type { PoolClient } from "pg";

import type {
  AccessEmailDelivery,
  AccessEmailDeliveryKind,
} from "./access/types";
import { database } from "./database";
import type {
  FeatureRequestInsert,
  FeatureRequestRecord,
  FeatureRequestStatus,
} from "./feedback/types";
import { GROW_PRODUCTS, productForEntitlement, type GrowProcessId } from "./grow/products";
import type { GrowPurchase, PersistGrowPurchaseResult } from "./grow/webhook";

type DeliveryRow = {
  id: string;
  kind: AccessEmailDeliveryKind;
  payer_email: string;
  payer_name: string;
  payment_link_process_id: string;
};

function deliveryFromRow(row: DeliveryRow): AccessEmailDelivery {
  const product = GROW_PRODUCTS[row.payment_link_process_id as GrowProcessId];
  if (!product) throw new Error("Stored purchase references an unknown Grow process");

  return {
    id: row.id,
    kind: row.kind,
    payerEmail: row.payer_email,
    payerName: row.payer_name,
    callbackPath: product.callbackPath,
    productName: product.name,
  };
}

async function rollback(client: PoolClient) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Preserve the original transaction error.
  }
}

export async function persistGrowPurchase(
  purchase: GrowPurchase,
): Promise<PersistGrowPurchaseResult> {
  const client = await database.connect();

  try {
    await client.query("BEGIN");
    const insertedPurchase = await client.query<{ id: string }>(
      `INSERT INTO purchases (
         provider,
         provider_transaction_id,
         payment_link_process_id,
         payer_email,
         payer_name,
         charged_total,
         currency,
         provider_payment_date
       )
       VALUES ('grow', $1, $2, $3, $4, $5, 'ILS', $6)
       ON CONFLICT (provider, provider_transaction_id) DO NOTHING
       RETURNING id`,
      [
        purchase.providerTransactionId,
        purchase.processId,
        purchase.payerEmail,
        purchase.payerName,
        purchase.chargedTotal,
        purchase.paymentDate,
      ],
    );

    const inserted = insertedPurchase.rowCount === 1;
    let purchaseId = insertedPurchase.rows[0]?.id;

    if (!purchaseId) {
      const existing = await client.query<{
        id: string;
        payment_link_process_id: string;
        payer_email: string;
        charged_total: string;
      }>(
        `SELECT id, payment_link_process_id, payer_email, charged_total::text
         FROM purchases
         WHERE provider = 'grow' AND provider_transaction_id = $1
         FOR UPDATE`,
        [purchase.providerTransactionId],
      );
      const row = existing.rows[0];
      if (
        !row ||
        row.payment_link_process_id !== purchase.processId ||
        row.payer_email !== purchase.payerEmail ||
        Number(row.charged_total) !== Number(purchase.chargedTotal)
      ) {
        throw new Error("Grow transaction replay did not match the stored purchase");
      }
      purchaseId = row.id;
    }

    if (inserted) {
      for (const item of purchase.items) {
        await client.query(
          `INSERT INTO purchase_items (purchase_id, provider_product_id, quantity)
           VALUES ($1, $2, $3)`,
          [purchaseId, item.productId, item.quantity],
        );
        await client.query(
          `INSERT INTO entitlements (
             purchase_id,
             entitlement_key,
             subject_email,
             quantity
           )
           VALUES ($1, $2, $3, $4)`,
          [purchaseId, item.entitlementKey, purchase.payerEmail, item.quantity],
        );
      }

      await client.query(
        `INSERT INTO access_email_deliveries (purchase_id, kind, state)
         VALUES ($1, 'initial-access', 'pending')`,
        [purchaseId],
      );
    }

    const delivery = await client.query<DeliveryRow>(
      `SELECT d.id, d.kind, p.payer_email, p.payer_name, p.payment_link_process_id
       FROM access_email_deliveries d
       JOIN purchases p ON p.id = d.purchase_id
       WHERE d.purchase_id = $1
         AND d.kind = 'initial-access'
         AND d.state IN ('pending', 'failed')`,
      [purchaseId],
    );

    await client.query("COMMIT");
    return {
      inserted,
      delivery: delivery.rows[0] ? deliveryFromRow(delivery.rows[0]) : null,
    };
  } catch (error) {
    await rollback(client);
    throw error;
  } finally {
    client.release();
  }
}

export async function claimAccessEmailDelivery(id: string) {
  const result = await database.query<DeliveryRow>(
    `UPDATE access_email_deliveries d
     SET state = 'sending',
         attempt_count = attempt_count + 1,
         last_attempt_at = now(),
         updated_at = now()
     FROM purchases p
     WHERE d.id = $1
       AND p.id = d.purchase_id
       AND (
         d.state IN ('pending', 'failed')
         OR (d.state = 'sending' AND d.last_attempt_at < now() - interval '10 minutes')
       )
     RETURNING d.id, d.kind, p.payer_email, p.payer_name, p.payment_link_process_id`,
    [id],
  );

  return result.rows[0] ? deliveryFromRow(result.rows[0]) : null;
}

export async function markAccessEmailSent(id: string, providerMessageId: string) {
  await database.query(
    `UPDATE access_email_deliveries
     SET state = 'sent', provider_message_id = $2, sent_at = now(),
         last_error = NULL, updated_at = now()
     WHERE id = $1`,
    [id, providerMessageId],
  );
}

export async function markAccessEmailFailed(id: string, error: unknown) {
  const sanitized = error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed";
  await database.query(
    `UPDATE access_email_deliveries
     SET state = 'failed', last_error = $2, updated_at = now()
     WHERE id = $1`,
    [id, sanitized],
  );
}

export async function queueAccessEmailForBuyer(email: string) {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const purchase = await client.query<{
      id: string;
      payer_email: string;
      payer_name: string;
      payment_link_process_id: string;
      entitlement_key: string;
    }>(
      `SELECT p.id, p.payer_email, p.payer_name, p.payment_link_process_id,
              e.entitlement_key
       FROM entitlements e
       JOIN purchases p ON p.id = e.purchase_id
       WHERE e.subject_email = $1 AND e.revoked_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT 1
       FOR UPDATE OF p`,
      [email],
    );
    const row = purchase.rows[0];
    if (!row || !productForEntitlement(row.entitlement_key)) {
      await client.query("COMMIT");
      return null;
    }

    const delivery = await client.query<DeliveryRow>(
      `INSERT INTO access_email_deliveries (purchase_id, kind, state)
       VALUES ($1, 'login', 'pending')
       ON CONFLICT (purchase_id, kind) DO UPDATE
       SET state = 'pending', last_error = NULL, updated_at = now()
       RETURNING id, kind, $2::text AS payer_email, $3::text AS payer_name,
                 $4::text AS payment_link_process_id`,
      [row.id, row.payer_email, row.payer_name, row.payment_link_process_id],
    );
    await client.query("COMMIT");
    return deliveryFromRow(delivery.rows[0]);
  } catch (error) {
    await rollback(client);
    throw error;
  } finally {
    client.release();
  }
}

export async function consumeMagicLinkRateLimit(
  fingerprint: string,
  maximumAttempts = 3,
  windowSeconds = 15 * 60,
) {
  const now = Date.now();
  const windowStartedAt = new Date(
    Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000,
  );
  const result = await database.query<{ attempts: number }>(
    `INSERT INTO magic_link_rate_limits (fingerprint, window_started_at, attempts)
     VALUES ($1, $2, 1)
     ON CONFLICT (fingerprint, window_started_at) DO UPDATE
     SET attempts = magic_link_rate_limits.attempts + 1
     RETURNING attempts`,
    [fingerprint, windowStartedAt],
  );
  return (result.rows[0]?.attempts ?? maximumAttempts + 1) <= maximumAttempts;
}

export async function findActiveEntitlement(email: string, entitlementKey: string) {
  const result = await database.query<{ id: string; claimed_user_id: string | null }>(
    `SELECT id, claimed_user_id
     FROM entitlements
     WHERE subject_email = $1 AND entitlement_key = $2 AND revoked_at IS NULL
     ORDER BY granted_at DESC
     LIMIT 1`,
    [email, entitlementKey],
  );
  return result.rows[0] ?? null;
}

export async function claimEntitlement(id: string, userId: string) {
  const result = await database.query(
    `UPDATE entitlements
     SET claimed_user_id = $2, claimed_at = COALESCE(claimed_at, now())
     WHERE id = $1 AND (claimed_user_id IS NULL OR claimed_user_id = $2)`,
    [id, userId],
  );
  return result.rowCount === 1;
}

export type GitHubRepositoryGrantState = "provisioning" | "invited" | "active" | "failed" | "revoked";

export type GitHubConnection = {
  userId: string;
  githubAccountId: string;
  githubLogin: string;
};

export async function upsertGitHubConnection(
  userId: string,
  betterAuthAccountId: string,
  githubAccountId: string,
  githubLogin: string,
): Promise<GitHubConnection> {
  const result = await database.query<{
    user_id: string;
    github_account_id: string;
    github_login: string;
  }>(
    `INSERT INTO github_connections (
       user_id, better_auth_account_id, github_account_id, github_login
     ) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
     SET better_auth_account_id = EXCLUDED.better_auth_account_id,
         github_login = EXCLUDED.github_login,
         updated_at = now()
     WHERE github_connections.github_account_id = EXCLUDED.github_account_id
     RETURNING user_id, github_account_id, github_login`,
    [userId, betterAuthAccountId, githubAccountId, githubLogin],
  );
  const row = result.rows[0];
  if (!row) throw new Error("A different GitHub account is already connected to this buyer");
  return {
    userId: row.user_id,
    githubAccountId: row.github_account_id,
    githubLogin: row.github_login,
  };
}

export async function findGitHubConnection(userId: string) {
  const result = await database.query<{
    user_id: string;
    github_account_id: string;
    github_login: string;
  }>(
    `SELECT user_id, github_account_id, github_login
     FROM github_connections
     WHERE user_id = $1`,
    [userId],
  );
  const row = result.rows[0];
  return row
    ? {
        userId: row.user_id,
        githubAccountId: row.github_account_id,
        githubLogin: row.github_login,
      }
    : null;
}

export async function listGitHubRepositoryGrants(entitlementId: string) {
  const result = await database.query<{
    repository: string;
    state: GitHubRepositoryGrantState;
    invitation_url: string | null;
    last_error: string | null;
  }>(
    `SELECT repository, state, invitation_url, last_error
     FROM github_repository_grants
     WHERE entitlement_id = $1
     ORDER BY repository`,
    [entitlementId],
  );
  return result.rows.map((row) => ({
    repository: row.repository,
    state: row.state,
    invitationUrl: row.invitation_url,
    lastError: row.last_error,
  }));
}

export async function claimGitHubRepositoryGrant(
  entitlementId: string,
  connectionUserId: string,
  repository: string,
) {
  const result = await database.query<{
    id: string;
    invitation_id: string | null;
    invitation_url: string | null;
  }>(
    `INSERT INTO github_repository_grants (
       entitlement_id, connection_user_id, repository, permission, state,
       attempt_count, last_attempt_at
     ) VALUES ($1, $2, $3, 'pull', 'provisioning', 1, now())
     ON CONFLICT (entitlement_id, repository) DO UPDATE
     SET connection_user_id = EXCLUDED.connection_user_id,
         state = 'provisioning',
         attempt_count = github_repository_grants.attempt_count + 1,
         last_attempt_at = now(),
         last_error = NULL,
         updated_at = now()
     WHERE github_repository_grants.state IN ('invited', 'failed')
        OR (
          github_repository_grants.state = 'provisioning'
          AND github_repository_grants.last_attempt_at < now() - interval '10 minutes'
        )
     RETURNING id, invitation_id::text, invitation_url`,
    [entitlementId, connectionUserId, repository],
  );
  const row = result.rows[0];
  return row
    ? {
        id: row.id,
        invitationId: row.invitation_id,
        invitationUrl: row.invitation_url,
      }
    : null;
}

export async function markGitHubRepositoryGrantSucceeded(
  id: string,
  state: "invited" | "active",
  invitationId: string | null,
  invitationUrl: string | null,
) {
  await database.query(
    `UPDATE github_repository_grants
     SET state = $2,
         invitation_id = $3,
         invitation_url = $4,
         granted_at = CASE WHEN $2 = 'active' THEN now() ELSE granted_at END,
         last_error = NULL,
         updated_at = now()
     WHERE id = $1 AND state = 'provisioning'`,
    [id, state, invitationId, invitationUrl],
  );
}

export async function markGitHubRepositoryGrantFailed(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await database.query(
    `UPDATE github_repository_grants
     SET state = 'failed', last_error = $2, updated_at = now()
     WHERE id = $1 AND state = 'provisioning'`,
    [id, message.slice(0, 500)],
  );
}

export async function insertFeatureRequest(request: FeatureRequestInsert) {
  await database.query(
    `INSERT INTO feature_requests (
       user_id, entitlement_id, subject_email, kind, target, title, body
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      request.userId,
      request.entitlementId,
      request.subjectEmail,
      request.kind,
      request.target,
      request.title,
      request.body,
    ],
  );
}

export async function countRecentFeatureRequests(userId: string) {
  const result = await database.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM feature_requests
     WHERE user_id = $1 AND created_at > now() - interval '1 hour'`,
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

type FeatureRequestRow = {
  id: string;
  kind: FeatureRequestRecord["kind"];
  target: FeatureRequestRecord["target"];
  title: string;
  body: string;
  status: FeatureRequestStatus;
  note: string | null;
  subject_email: string;
  created_at: Date;
  updated_at: Date;
};

function featureRequestFromRow(row: FeatureRequestRow): FeatureRequestRecord {
  return {
    id: row.id,
    kind: row.kind,
    target: row.target,
    title: row.title,
    body: row.body,
    status: row.status,
    note: row.note,
    subjectEmail: row.subject_email,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listFeatureRequests(limit = 200) {
  const result = await database.query<FeatureRequestRow>(
    `SELECT id, kind, target, title, body, status, note, subject_email, created_at, updated_at
     FROM feature_requests
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows.map(featureRequestFromRow);
}

export async function updateFeatureRequestStatus(
  id: string,
  status: FeatureRequestStatus,
  note: string | null,
) {
  const result = await database.query<FeatureRequestRow>(
    `UPDATE feature_requests
     SET status = $2, note = $3, updated_at = now()
     WHERE id = $1
     RETURNING id, kind, target, title, body, status, note, subject_email, created_at, updated_at`,
    [id, status, note],
  );
  return result.rows[0] ? featureRequestFromRow(result.rows[0]) : null;
}
