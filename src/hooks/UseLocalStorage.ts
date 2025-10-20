import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
    const [value, setState] = useState<T>(() => {
            const raw = localStorage.getItem(key);
            if(raw != null) return JSON.parse(raw) as T;
            return typeof initial === "function" ? (initial as () => T)() : initial;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setState] as const;
}