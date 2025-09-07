import { useState, useEffect } from 'react';

export function useDebounce<T>(value: Tdelay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(_() => {
    const _handler = setTimeout(_() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}