// src/utils/sample.ts
import { addDays, startOfDay } from "date-fns";
import type { Task } from "../Types";
import { ymd } from "./Date";

export function createSampleTasks(): Task[] {
  const base = startOfDay(new Date());
  return [
    { id: crypto.randomUUID(), name: "要件定義 & 草案",
      start: ymd(base), end: ymd(addDays(base, 2)), progress: 80, color: "#60a5fa" },
    { id: crypto.randomUUID(), name: "型定義",
      start: ymd(addDays(base, 1)), end: ymd(addDays(base, 4)), progress: 50, color: "#34d399" },
    { id: crypto.randomUUID(), name: "ガント土台",
      start: ymd(addDays(base, 3)), end: ymd(addDays(base, 9)), progress: 30, color: "#f472b6" },
    { id: crypto.randomUUID(), name: "CRUD/仕上げ",
      start: ymd(addDays(base, 7)), end: ymd(addDays(base, 12)), progress: 10, color: "#f59e0b" },
  ];
}
