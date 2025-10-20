//日付ユーティリティ
import { addDays, eachDayOfInterval } from "date-fns";


/** "YYYY-MM-DD" → Date(ローカル) */
export function fromISO(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m?? 1) - 1, d ?? 1); //TZズレ回避
}

/**Date →　"YYYY-MM-DD" */
export function ymd(dt: Date): string {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**表示開始日と日数から連続配列を作る */
export function makeDateRange(start: string, days: number): Date[] {
    const s = typeof start === "string" ? fromISO(start) : start;
    const e = addDays(s, days -1);
    return eachDayOfInterval({start: s, end: e});
}

/**同じ日か（時刻無視） */
export function isSameYMD(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); 
}

/**週末（日：０/ 土：６） */
export function isWeekend(dt: Date): boolean {
    const w = dt.getDay();
    return w === 0 || w === 6;
}