import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";

type Props = {
  href: string; // Notion の告知ページURL
  latestVersion?: string; // 例: "1.0.0" なくても可
};

const LS_KEY_LAST_SEEN = "tp:notices:lastSeenVersion";

// ごく簡易な semver 比較（不正値は 0 扱い）
function cmp(a = "0.0.0", b = "0.0.0") {
  const pa = a.split(".").map((n) => parseInt(n || "0", 10));
  const pb = b.split(".").map((n) => parseInt(n || "0", 10));
  for (let i = 0; i < 3; i++) {
    const da = pa[i] || 0,
      db = pb[i] || 0;
    if (da !== db) return da - db;
  }
  return 0;
}

export default function NoticeLink({ href, latestVersion }: Props) {
  // 未読ドット（latestVersion があるときだけ使う）
  const [lastSeen, setLastSeen] = useState<string>(() => {
    return localStorage.getItem(LS_KEY_LAST_SEEN) || "0.0.0";
  });
  const hasUnread = useMemo(
    () => !!latestVersion && cmp(lastSeen, latestVersion) < 0,
    [lastSeen, latestVersion]
  );

  // ページ復帰時（Back/Forward）でも最新を見にいく
  useEffect(() => {
    const onFocus = () => {
      const v = localStorage.getItem(LS_KEY_LAST_SEEN) || "0.0.0";
      setLastSeen(v);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // クリックしたら既読に（最新バージョンがあれば）
  const handleClick = () => {
    if (latestVersion) {
      localStorage.setItem(LS_KEY_LAST_SEEN, latestVersion);
      setLastSeen(latestVersion);
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className="relative inline-flex items-center justify-center h-9 px-3 rounded-xl border hover:bg-amber-100"
      aria-label="おしらせ"
      title="おしらせ（Notionで開く）"
    >
      <Bell className="w-5 h-5" />
      {/* 未読ドット：不要ならこの <span> を削除 */}
      {hasUnread && (
        <span
          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500"
          aria-hidden
        />
      )}
      <span className="ml-2 text-sm">おしらせ</span>
    </a>
  );
}
