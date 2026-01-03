import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dietly_scan_history";
const MAX_HISTORY = 20;

/**
 * Hook to manage scan history in localStorage
 */
export const useScanHistory = () => {
  const [scanHistory, setScanHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setScanHistory(JSON.parse(stored));
      }
    } catch {
      console.error("Failed to load scan history");
    }
  }, []);

  // Add a new scan to history
  const addScan = useCallback((scanResult) => {
    if (!scanResult?.report) return;

    const newScan = {
      id: Date.now(),
      productName: scanResult.report.productName || "Unknown Product",
      servingSize: scanResult.report.servingSize,
      nutrients: scanResult.report.nutrients || [],
      scannedAt: new Date().toISOString(),
      fullResult: scanResult,
    };

    setScanHistory((prev) => {
      const updated = [newScan, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newScan;
  }, []);

  // Get summaries for copilot context
  const getScanSummaries = useCallback(() => {
    return scanHistory.slice(0, 5).map((s) => ({
      name: s.productName,
      scannedAt: s.scannedAt,
      keyNutrients: s.nutrients
        .slice(0, 3)
        .map((n) => `${n.name}: ${n.value}${n.unit}`),
    }));
  }, [scanHistory]);

  // Get recent scans for display
  const getRecentScans = useCallback(
    (count = 5) => scanHistory.slice(0, count),
    [scanHistory]
  );

  // Clear history
  const clearHistory = useCallback(() => {
    setScanHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    scanHistory,
    addScan,
    getScanSummaries,
    getRecentScans,
    clearHistory,
  };
};
