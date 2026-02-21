import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export function useFetchScenario(selectedScenario) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedScenario) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/scenarios/${selectedScenario}/timeseries`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load scenario (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unknown error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedScenario]);

  return { data, loading, error };
}
