import { useState, useEffect } from 'react';
import { loadDictionary, isDictionaryLoaded } from '../engine/wordValidator';

export function useDictionary() {
  const [loaded, setLoaded] = useState(isDictionaryLoaded());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;

    loadDictionary()
      .then(() => setLoaded(true))
      .catch((err) => setError(err.message));
  }, [loaded]);

  return { loaded, error };
}
