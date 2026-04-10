"use client"

import { useEffect, useState } from "react";
import { formatDistance } from "date-fns";

interface RelativeTimeProps {
  date: string;
  updateIntervalMs?: number;
}

export default function RelativeTime({ date, updateIntervalMs = 60000 }: RelativeTimeProps) {
  const [now, setNow] = useState<number | null>(null);
  const dateObj = new Date(date);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, updateIntervalMs);
    return () => clearInterval(interval);
  }, [updateIntervalMs]);

  // Keep the initial SSR/CSR markup deterministic to avoid hydration mismatches.
  if (now === null) {
    return <time dateTime={dateObj.toISOString()}>{dateObj.toISOString().slice(0, 10)}</time>;
  }

  return <time dateTime={dateObj.toISOString()}>{formatDistance(dateObj, now, { addSuffix: true })}</time>;
}
