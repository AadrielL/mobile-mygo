import { useEffect, useState } from 'react';

/**
 * Hook de debounce (padrão 400ms conforme Prompt 03 / GEMINI.md)
 * para evitar disparos repetidos de filtro ou chamadas de API a cada tecla digitada.
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
