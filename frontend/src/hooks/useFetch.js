import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { cacheSet, cacheGet } from "@/lib/offline";

// Fetch with offline cache fallback (offline-first read path).
export default function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!path) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(path);
      setData(res.data);
      setError(null);
      cacheSet(path, res.data);
    } catch (e) {
      const cached = cacheGet(path);
      if (cached) setData(cached);
      else setError(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  return { data, loading, error, reload: load };
}
