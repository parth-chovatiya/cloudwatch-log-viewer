/**
 * Debounce a value by a given delay.
 * @param value The value to debounce
 * @param delay The debounce delay in ms
 */
import { useState, useEffect } from "react";

export const useDebounce = (value: string, delay = 300): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

/**
 * Format a timestamp as a locale string.
 * @param timestamp Unix timestamp in ms
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Export log events as a JSON file.
 * @param logEvents Array of log events
 */
export const exportLogs = (logEvents: unknown[]): void => {
  const dataStr = JSON.stringify(logEvents, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cloudwatch-logs-${Date.now()}.json`;
  link.click();
};
