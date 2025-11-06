"use client";

import { useState, useEffect } from "react";

import { logger } from "@/lib/logger";
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      logger.error(`Error setting localStorage key "${key}":`, { error });
    }
  };

  useEffect(() => {
    try {
      // Get from local storage by key
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      }
    } catch (error) {
      // If error also return initialValue
      logger.error(`Error reading localStorage key "${key}":`, { error });
    }
  }, [key]);

  return [storedValue, setValue];
}
