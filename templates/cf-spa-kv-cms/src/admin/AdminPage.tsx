import { useEffect, useState } from "react";
import {
  LogOut,
  RotateCcw,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
} from "lucide-react";
import clsx from "clsx";
import { SECTIONS, type FieldDef } from "./schema";

const TOKEN_KEY = "your_project_admin_token";

type AnyRecord = Record<string, any>;
type Notice = { type: "ok" | "err"; text: string } | null;

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [content, setContent] = useState<AnyRecord | null>(null);
  const [activeKey, setActiveKey] = useState(SECTIONS[0].key);
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const notify = (type: "ok" | "err", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 3500);
  };

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setContent(null);
  };

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const res = await fetch("/api/content");
        if (!res.ok) throw new Error("load failed");
        setContent(await res.json());
      } catch {
        notify("err", "無法載入內容，請重新整理");
      }
    };
    load();
  }, [token]);

  const authedFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error("登入已過期，請重新登入");
    }
    return res;
  };

  const saveSection = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await authedFetch("/api/content", {
        method: "PUT",
        body: JSON.stringify({ [activeKey]: content[activeKey] }),
      });
      const data = (await res.json()) as AnyRecord;
      if (!res.ok) throw new Error(data.error || "儲存失敗");
      setContent(data.data);
      notify("ok", "已儲存，網站即時生效");
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const resetAll = async () => {
    if (!window.confirm("確定還原全部內容為預設值？此操作會覆蓋所有修改。")) return;
    setResetting(true);
    try {
      const res = await authedFetch("/api/content/reset", { method: "POST" });
      const data = (await res.json()) as AnyRecord;
      if (!res.ok) throw new Error(data.error || "還原失敗");
      setContent(data.data);
      notify("ok", "已還原預設內容");
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "還原失敗");
    } finally {
      setResetting(false);
    }
  };

  if (!token) {
    return <LoginCard onLogin={(t) => setToken(t)} />;
  }

  const section = SECTIONS.find((s) => s.key === activeKey) ?? SECTIONS[0];

  return (
    <div className="min-h-screen bg-rice-50">
      {/* 頂欄 */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-800 font-serif text-base font-bold text-rice-100">
              徐
            </span>
            <div>
              <p className="font-serif text-base font-bold text-pine-900">內容管理後台</p>
              <p className="text-xs text-stone-500">修改儲存後網站即時生效，無需重新部署</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-pine-700 transition hover:bg-pine-50"
            >
              <ExternalLink className="h-4 w-4" />
              查看網站
            </a>
            <button
              type="button"
              onClick={resetAll}
              disabled={resetting || !content}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              還原預設
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
            >
              <LogOut className="h-4 w-4" />
              登出
            </button>
          </div>
        </div>
      </header>

      {/* 通知 */}
      {notice && (
        <div
          className={clsx(
            "fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-lg",
            notice.type === "ok" ? "bg-pine-700" : "bg-red-600"
          )}
        >
          {notice.text}
        </div>
      )}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
        {/* 側欄 */}
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={clsx(
                "whitespace-nowrap rounded-xl px-4 py-2.5 text-left text-sm font-medium transition",
                s.key === activeKey
                  ? "bg-pine-700 text-white shadow"
                  : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-pine-50"
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* 編輯區 */}
        <main className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-stone-100">
          {!content ? (
            <div className="flex items-center justify-center py-20 text-stone-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              載入中…
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between border-b border-stone-100 pb-4">
                <h1 className="font-serif text-xl font-bold text-pine-900">{section.label}</h1>
                <button
                  type="button"
                  onClick={saveSection}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-pine-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-pine-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  儲存此區塊
                </button>
              </div>
              <div className="space-y-5">
                {section.fields.map((def) => (
                  <FieldRenderer
                    key={def.key}
                    def={def}
                    value={content[activeKey]?.[def.key]}
                    onChange={(v) =>
                      setContent({
                        ...content,
                        [activeKey]: { ...content[activeKey], [def.key]: v },
                      })
                    }
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------- 登入卡片 ----------

function LoginCard({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as AnyRecord;
      if (!res.ok) throw new Error(data.error || "登入失敗");
      try {
        localStorage.setItem(TOKEN_KEY, data.token);
      } catch {
        // ignore
      }
      onLogin(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-rice-50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-100"
      >
        <div className="mb-6 flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pine-800 text-rice-100">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-4 font-serif text-xl font-bold text-pine-900">內容管理後台</h1>
          <p className="mt-1 text-sm text-stone-500">請輸入管理員帳號密碼</p>
        </div>

        <label className="block text-sm font-medium text-stone-700">帳號</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-100"
        />

        <label className="mt-4 block text-sm font-medium text-stone-700">密碼</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-100"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-pine-700 py-3 text-sm font-medium text-white transition hover:bg-pine-600 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          登入
        </button>
      </form>
    </div>
  );
}

// ---------- 表單欄位渲染 ----------

function FieldRenderer({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  if (def.kind === "object") {
    const obj = value ?? {};
    return (
      <fieldset className="rounded-xl border border-stone-200 p-4">
        <legend className="px-2 text-sm font-semibold text-pine-800">{def.label}</legend>
        <div className="space-y-4">
          {def.fields.map((f) => (
            <FieldRenderer
              key={f.key}
              def={f}
              value={obj[f.key]}
              onChange={(v) => onChange({ ...obj, [f.key]: v })}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  if (def.kind === "list") {
    return <ListEditor def={def} value={Array.isArray(value) ? value : []} onChange={onChange} />;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700">{def.label}</label>
      {def.kind === "text" ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-100"
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-100"
        />
      )}
      {def.hint && <p className="mt-1 text-xs text-stone-500">{def.hint}</p>}
      {def.kind === "image" && typeof value === "string" && value && (
        <img
          src={value}
          alt="預覽"
          className="mt-2 h-20 rounded-lg border border-stone-200 object-cover"
        />
      )}
    </div>
  );
}

// ---------- 列表編輯器 ----------

function ListEditor({
  def,
  value,
  onChange,
}: {
  def: Extract<FieldDef, { kind: "list" }>;
  value: any[];
  onChange: (v: any[]) => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const addItem = () => {
    const template: AnyRecord = {};
    def.fields.forEach((f) => {
      template[f.key] = f.kind === "list" ? [] : f.kind === "object" ? {} : "";
    });
    onChange([...value, template]);
    setOpenIdx(value.length);
  };

  const removeItem = (i: number) => {
    if (!window.confirm(`確定刪除這個${def.itemName}？`)) return;
    onChange(value.filter((_, idx) => idx !== i));
    setOpenIdx(null);
  };

  const itemTitle = (item: AnyRecord, i: number) => {
    const firstKey = def.fields[0]?.key;
    const text = firstKey && typeof item[firstKey] === "string" ? item[firstKey] : "";
    const labelKey = def.fields.find((f) => f.key === "title" || f.key === "q" || f.key === "label" || f.key === "day");
    const label = labelKey ? item[labelKey.key] : "";
    return label || text || `${def.itemName} ${i + 1}`;
  };

  return (
    <div className="rounded-xl border border-stone-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-pine-800">
          {def.label}
          <span className="ml-2 text-xs font-normal text-stone-500">共 {value.length} 項</span>
        </p>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 rounded-full bg-pine-50 px-3 py-1.5 text-xs font-medium text-pine-700 transition hover:bg-pine-100"
        >
          <Plus className="h-3.5 w-3.5" />
          新增{def.itemName}
        </button>
      </div>

      <div className="space-y-2">
        {value.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="rounded-lg border border-stone-200 bg-rice-50/50">
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-stone-700"
                >
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-pine-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-stone-400" />
                  )}
                  <span className="truncate">{itemTitle(item, i)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label="刪除"
                  className="rounded-full p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {isOpen && (
                <div className="space-y-4 border-t border-stone-200 bg-white p-4">
                  {def.fields.map((f) => (
                    <FieldRenderer
                      key={f.key}
                      def={f}
                      value={item[f.key]}
                      onChange={(v) => {
                        const next = [...value];
                        next[i] = { ...item, [f.key]: v };
                        onChange(next);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {value.length === 0 && (
          <p className="py-4 text-center text-sm text-stone-500">暫無項目，點上方「新增」</p>
        )}
      </div>
    </div>
  );
}
