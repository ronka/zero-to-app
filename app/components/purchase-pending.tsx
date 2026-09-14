"use client";

import { useEffect, useState } from "react";

const WAIT_SECONDS = 20;

export function PurchasePending() {
  const [seconds, setSeconds] = useState(WAIT_SECONDS);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  return seconds > 0 ? (
    <p className="mt-5 text-zinc-400" role="status">
      אנחנו מעבדים את הרכישה. המייל אמור להגיע בקרוב — עוד {seconds} שניות אפשר לבקש אותו שוב.
    </p>
  ) : (
    <p className="mt-5 text-zinc-300" role="status">
      עדיין אין מייל? אפשר להשתמש בטופס למטה. הבקשה בטוחה גם אם ה־webhook עוד בדרך.
    </p>
  );
}
