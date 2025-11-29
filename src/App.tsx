import { useMemo, useRef } from "react";
import { useLocalStorage } from "./hooks/UseLocalStorage";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfDay,
} from "date-fns";
import { Calendar, Link, Plus } from "lucide-react";

import type { Task } from "./Types";
import { makeDateRange, fromISO, ymd } from "./utils/Date";
import { createSampleTasks } from "./utils/Sample";
import { CELL_W, ROW_H, NAME_W } from "./constants";
import HeaderGrid from "./components/HeaderGrid";
import NoticeLink from "./components/NoticeLink";

export default function App() {
  // 初回のみ createSampleTasks() でタスク一覧を生成
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "tp:tasks",
    createSampleTasks()
  );

  //表示期間（日数）のデフォルト設定
  const [viewDays, setViewDays] = useLocalStorage<number>("tp:viewDays", 30);
  const [viewStart, setViewStart] = useLocalStorage<string>(
    "tp:viewStart",
    () => {
      const today = startOfDay(new Date());
      const half = Math.floor(30 / 2);
      return ymd(addDays(today, -half));
    }
  );

  //右側で使う日時配列（レンタリング負荷を避けるために　useMemo）
  const days = useMemo(
    () => makeDateRange(viewStart, viewDays),
    [viewStart, viewDays]
  );

  //共通スクロール
  const scrollRef = useRef<HTMLDivElement | null>(null);

  //中身は仮
  const addTask = () => {
    const today = new Date();
    const id = crypto.randomUUID();
    const newTask: Task = {
      id,
      name: `新規タスク ${tasks.length + 1}`,
      start: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(today.getDate()).padStart(2, "0")}`,
      end: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(today.getDate() + 3).padStart(2, "0")}`,
      progress: 0,
      color: "#60a5fa",
    };
    setTasks((prev) => [...prev, newTask]);

    //バーの左位置へスムーズスクロール
    setTimeout(() => {
      const rect = barRect(newTask.start, newTask.end, viewStart, viewDays);
      if (rect && scrollRef.current) {
        const margin = CELL_W * 2;
        scrollRef.current.scrollTo({
          left: Math.max(rect.left - margin, 0),
          behavior: "smooth",
        });
      }
    }, 0);
  };

  // === 追加: CRUDユーティリティ（addTaskの直後に追記） ======================
  const clamp = (n: number, min: number, max: number) =>
    Math.min(max, Math.max(min, n));

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const confirmAndRemove = (task: Task) => {
    const ok = window.confirm(`「${task.name}」を削除しますか？`);
    if (ok) removeTask(task.id);
  };

  const moveTask = (id: string, dir: -1 | 1) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const ni = Math.max(0, Math.min(prev.length - 1, idx + dir));
      if (ni === idx) return prev;
      const arr = [...prev];
      const [sp] = arr.splice(idx, 1);
      arr.splice(ni, 0, sp);
      return arr;
    });
  };
  // =====================================================================

  /** バーの left/width を算出。範囲外はクリップして null */
  function barRect(
    startISO: string,
    endISO: string,
    viewStart: string,
    viewDays: number
  ) {
    const s = fromISO(startISO);
    const e = fromISO(endISO);
    const vs = fromISO(viewStart);
    let offset = differenceInCalendarDays(s, vs);
    let span = differenceInCalendarDays(e, s) + 1;

    if (offset >= viewDays || offset + span <= 0) return null; //完全に見切れ
    if (offset < 0) {
      span += offset;
      offset = 0;
    } //左クリップ
    if (offset + span > viewDays) {
      span = viewDays - offset;
    } //右クリップ

    return { left: offset * CELL_W, width: Math.max(span * CELL_W, 4) };
  }

  /**月の表示 */
  function monthSegments(days: Date[]) {
    const seg: { label: string; span: number }[] = [];
    let i = 0;
    while (i < days.length) {
      const label = format(days[i], "M'月'");
      let j = i + 1;
      while (j < days.length && format(days[j], "M'月'") === label) j++;
      seg.push({ label, span: j - i });
      i = j;
    }
    return seg;
  }

  /**今日を中央に */
  const centerOnToday = () => {
    const half = Math.floor(viewDays / 2);
    const today = startOfDay(new Date());
    setViewStart(ymd(addDays(today, -half)));
  };

  /**今日ラインのx座標 */
  const todayX = useMemo(() => {
    const off = differenceInCalendarDays(
      startOfDay(new Date()),
      fromISO(viewStart)
    );
    if (off < 0 || off >= viewDays) return null; // 表示範囲の外
    return off * CELL_W;
  }, [viewStart, viewDays]);

  /**ウィンドウを前後にずらす */
  const shiftWindow = (delta: number) => {
    const next = addDays(fromISO(viewStart), delta);
    setViewStart(ymd(next));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-stone-800">
      {/* Header(固定) */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        {/* 横幅：中央寄せ＆内側の左右空白 */}
        <div className="max-w-6xl mx-auto h-[56px] px-4 flex items-center gap-3">
          {/* 左タイトル */}
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="w-5 h-5" />
            TaskPort
          </div>
          {/* 右側アクション */}
          <div className="ml-auto flex items-center gap-2">
            {/* 既存のボタンがあればそのまま並べる */}
            <NoticeLink
              href="https://sore-honeycrisp-562.notion.site/TaskPort-292bc5dc6ec480cf8d64c97fe62c1b8b"
              latestVersion="1.0.0" // 未読ドット不要ならこの行ごと消してOK
            />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto p-4">
        {/* スマホ：１列　/　md以上：左固定340px + 右1fr */}
        <section className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4">
          {/* 左：設定パネル */}
          <aside className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold mb-3">表示設定</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-600 mb-1">開始日</label>
                <input
                  type="date"
                  value={viewStart}
                  onChange={(e) => setViewStart(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">表示日数</label>
                <select
                  value={viewDays}
                  onChange={(e) => setViewDays(parseInt(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  {[30, 60, 90, 120].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* デバッグ：いまの days を軽く確認（実装後は消してOK） */}
              <p className="text-xs text-slate-500">
                現在の表示: {viewStart} から {viewDays} 日（配列長 {days.length}
                ）
              </p>
            </div>
          </aside>

          {/* 右：操作パネル */}
          <aside className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold mb-3">操作</h2>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="px-5 py-1.5 rounded-xl bg-blue-500 text-white flex items-center gap-1 hover:bg-blue-800"
                type="button"
                onClick={addTask}
              >
                <Plus className="w-4 h-4" />
                タスク追加
              </button>
              <button
                className="px-3 py-1.5 rounded-xl border bg-green-500 text-white flex items-center gap-1 hover:bg-green-800"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("start", viewStart);
                  url.searchParams.set("days", viewDays.toString());
                  navigator.clipboard
                    .writeText(url.toString())
                    .then(() => {
                      alert("リンクをクリップボードにコピーしました！");
                    })
                    .catch(() => {
                      alert("クリップボードへのコピーに失敗しました。");
                    });
                }}
              >
                <Link className="w-4 h-4" />
                共有リンク生成
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1" />
              <button
                className="px-3 py-1.5 rounded-xl border hover:bg-amber-100"
                onClick={() => shiftWindow(-7)}
              >
                {"<<"} 1週
              </button>
              <button
                className="px-3 py-1.5 rounded-xl border hover:bg-amber-100"
                onClick={() => shiftWindow(-1)}
              >
                {"<"} 1日
              </button>
              <button
                className="px-3 py-1.5 rounded-xl bg-green-500 text-white hover:bg-green-800"
                onClick={centerOnToday}
              >
                今日を中央
              </button>
              <button
                className="px-3 py-1.5 rounded-xl border hover:bg-amber-100"
                onClick={() => shiftWindow(1)}
              >
                1日 {">"}
              </button>
              <button
                className="px-3 py-1.5 rounded-xl border hover:bg-amber-100"
                onClick={() => shiftWindow(7)}
              >
                1週 {">>"}
              </button>
            </div>

            {/* === 追加: 簡易エディタ（インラインCRUD） ======================= */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 mt-3">
              {tasks.map((t, i) => (
                <div key={t.id} className="border rounded-xl p-2">
                  {/* 1行目：名前＋並び替え＋削除 */}
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border px-2 py-1"
                      value={t.name}
                      onChange={(e) =>
                        updateTask(t.id, { name: e.target.value })
                      }
                      placeholder="タスク名"
                    />
                    <button
                      className="px-2 py-1 rounded-lg border"
                      onClick={() => moveTask(t.id, -1)}
                      disabled={i === 0}
                      title="1つ上へ"
                    >
                      ▲
                    </button>
                    <button
                      className="px-2 py-1 rounded-lg border"
                      onClick={() => moveTask(t.id, +1)}
                      disabled={i === tasks.length - 1}
                      title="1つ下へ"
                    >
                      ▼
                    </button>
                    <button
                      className="px-2 py-1 rounded-lg border text-red-600"
                      onClick={() => confirmAndRemove(t)}
                      title="削除"
                    >
                      削除
                    </button>
                  </div>

                  {/* 2行目：開始/終了/進捗/色 */}
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <label className="flex items-center gap-2">
                      <span className="w-10 text-slate-500">開始</span>
                      <input
                        type="date"
                        className="flex-1 rounded-lg border px-2 py-1"
                        value={t.start}
                        onChange={(e) => {
                          const start = e.target.value;
                          const end = t.end < start ? start : t.end; // start<=end を保証
                          updateTask(t.id, { start, end });
                        }}
                      />
                    </label>

                    <label className="flex items-center gap-2">
                      <span className="w-10 text-slate-500">終了</span>
                      <input
                        type="date"
                        className="flex-1 rounded-lg border px-2 py-1"
                        value={t.end}
                        onChange={(e) => {
                          const end = e.target.value;
                          const start = t.start > end ? end : t.start; // start<=end を保証
                          updateTask(t.id, { end, start });
                        }}
                      />
                    </label>

                    <label className="flex items-center gap-2">
                      <span className="w-10 text-slate-500">% </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 rounded-lg border px-2 py-1"
                        value={t.progress}
                        onChange={(e) =>
                          updateTask(t.id, {
                            progress: clamp(Number(e.target.value), 0, 100),
                          })
                        }
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        className="flex-1"
                        value={t.progress}
                        onChange={(e) =>
                          updateTask(t.id, { progress: Number(e.target.value) })
                        }
                      />
                    </label>

                    <label className="flex items-center gap-2">
                      <span className="w-10 text-slate-500">色</span>
                      <input
                        type="color"
                        className="h-8 w-12 rounded-lg border"
                        value={t.color}
                        onChange={(e) =>
                          updateTask(t.id, { color: e.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {/* ============================================================= */}
          </aside>
        </section>

        {/* 下段：全幅のガントセクション */}
        <section className="mt-6 bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold mb-3">ガントボード</h2>

          {/* ===== レイアウト：左固定 + 右共通スクロール ===== */}
          <div className="flex">
            {/* 左：固定列（ヘッダ + 行） */}
            <div
              className="shrink-0"
              style={{ width: NAME_W, minWidth: NAME_W }}
            >
              {/* 左ヘッダ：タスク一覧（右ヘッダと高さを合わせる h-14） */}
              <div className="px-3 h-14 flex items-end text-sm text-slate-600 border-b border-slate-200">
                タスク一覧
              </div>

              {/* 左行：タスク名＋% */}
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 px-3 border-b border-slate-100 hover:bg-slate-50/70"
                  style={{ height: ROW_H }}
                  title={t.name}
                >
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ background: t.color }}
                  />
                  <div className="truncate">{t.name}</div>
                  <div className="ml-auto text-slate-400 text-[11px] tabular-nums">
                    {t.progress}%
                  </div>
                </div>
              ))}
            </div>

            {/* 右：ヘッダ（月/日）＋ 行（バー）= 同じスクロール領域 */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden"
            >
              {/**← ラッパー：絶対配置の基準＆全期間幅 */}
              <div className="relative" style={{ width: viewDays * CELL_W }}>
                {/**今日ライン */}
                {todayX !== null && (
                  <div
                    className="absolute top-6 bottom-0 w-[2px] bg-red-500 z-[3] pointer-events-none"
                    style={{ left: todayX }}
                    aria-hidden
                  />
                )}

                {/* 右ヘッダ（月＋日） */}
                <div className="relative h-14 select-none">
                  <div className="absolute inset-0 z-[0] pointer-events-none">
                    <HeaderGrid days={days} />
                  </div>

                  {/* 月 */}
                  <div className="absolute left-0 right-0 top-0 h-6 z-[2] bg-white">
                    <div
                      className="grid text-[11px] text-slate-600"
                      style={{
                        gridTemplateColumns: monthSegments(days)
                          .map((s) => `${s.span * CELL_W}px`)
                          .join(" "),
                      }}
                    >
                      {monthSegments(days).map((m, idx) => (
                        <div
                          key={idx}
                          className="px-2 flex items-center border-l border-slate-200"
                        >
                          {m.label}
                        </div>
                      ))}
                    </div>
                    <div className="absolute left-0 right-0 bottom-0 border-b border-slate-200" />
                  </div>

                  {/* 日 */}
                  <div className="absolute left-0 right-0 bottom-0 h-8 z-[2] bg-white">
                    <div
                      className="grid h-8"
                      style={{
                        gridTemplateColumns: `repeat(${viewDays}, ${CELL_W}px)`,
                      }}
                    >
                      {days.map((dt, i) => {
                        const weekend = [0, 6].includes(dt.getDay());
                        const isToday = ymd(dt) === ymd(new Date());
                        return (
                          <div
                            key={i}
                            className={`border-l border-slate-200 flex flex-col items-center justify-center text-[11px] ${
                              weekend ? "bg-slate-50" : ""
                            }`}
                          >
                            <div
                              className={
                                isToday
                                  ? "text-blue-700 font-semibold"
                                  : "text-slate-600"
                              }
                            >
                              {dt.getDate()}
                            </div>
                            <div
                              className={
                                isToday ? "text-blue-500" : "text-slate-400"
                              }
                            >
                              {"日月火水木金土"[dt.getDay()]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 右行：縦グリッド＋タスクバー */}
                <div style={{ width: viewDays * CELL_W }}>
                  {tasks.map((t) => {
                    const rect = barRect(t.start, t.end, viewStart, viewDays);
                    return (
                      <div
                        key={t.id}
                        className="relative border-b border-slate-100"
                        style={{ height: ROW_H }}
                      >
                        {/* 縦グリッド（見た目） */}
                        <div
                          className="grid h-full"
                          style={{
                            gridTemplateColumns: `repeat(${viewDays}, ${CELL_W}px)`,
                          }}
                        >
                          {days.map((_, i) => (
                            <div
                              key={i}
                              className="border-l border-slate-100"
                            />
                          ))}
                        </div>

                        {/* タスクバー */}
                        {rect && (
                          <div
                            className="absolute top-1.5 h-5 rounded-lg shadow-sm"
                            style={{
                              left: rect.left,
                              width: rect.width,
                              background: t.color,
                            }}
                            title={`${t.name}: ${t.start} → ${t.end}`}
                          >
                            {/* 進捗オーバーレイ */}
                            <div
                              className="h-full rounded-lg"
                              style={{
                                width: `${t.progress}%`,
                                background: "rgba(0,0,0,.12)",
                              }}
                            />
                            {/* バー内ラベル */}
                            <div className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] text-white drop-shadow">
                              {t.name}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="pb-4" />
        </section>
      </main>
    </div>
  );
}
