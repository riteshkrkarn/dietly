import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dietly_preferences";

/**
 * Hook to manage user health preferences in localStorage
 */
export const usePreferences = () => {
  const [preferences, setPreferences] = useState([]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch {
      console.error("Failed to load preferences");
    }
  }, []);

  // Save a new preference
  const savePreference = useCallback((key, label) => {
    setPreferences((prev) => {
      // Avoid duplicates
      if (prev.some((p) => p.key === key)) return prev;

      const updated = [
        ...prev,
        { key, label, savedAt: new Date().toISOString() },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Remove a preference
  const removePreference = useCallback((key) => {
    setPreferences((prev) => {
      const updated = prev.filter((p) => p.key !== key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check if preference exists
  const hasPreference = useCallback(
    (key) => preferences.some((p) => p.key === key),
    [preferences]
  );

  // Get preference labels for API
  const getPreferenceLabels = useCallback(
    () => preferences.map((p) => p.label),
    [preferences]
  );

  return {
    preferences,
    savePreference,
    removePreference,
    hasPreference,
    getPreferenceLabels,
  };
};
