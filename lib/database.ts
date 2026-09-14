import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  databasePool?: Pool;
};

function connectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

export const database =
  globalForDatabase.databasePool ??
  new Pool({
    connectionString: connectionString(),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.databasePool = database;
}
