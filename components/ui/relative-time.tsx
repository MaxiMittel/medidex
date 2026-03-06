"use client"

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface RelativeTimeProps {
  date: string;
  updateIntervalMs?: number;
}

export default function RelativeTime({ date, updateIntervalMs = 60000 }: RelativeTimeProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, updateIntervalMs);
    return () => clearInterval(interval);
  }, [updateIntervalMs]);

  return <>{formatDistanceToNow(new Date(date), { addSuffix: true })}</>;
}
