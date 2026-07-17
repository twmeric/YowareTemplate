import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  RefreshCw,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminOrder } from "../../api/platform";

const API_URL =
  import.meta.env.VITE_PLATFORM_API_URL ||
  "https://jkd-platform-api-worker.jimsbond007.workers.dev";

interface Order {
  id: number;
  publicId: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  createdAt: string;
  briefAnswers?: Record<string, unknown>;
  generatedContent?: Record<string, unknown>;
}

interface OrderDetail extends Order {
  updatedAt: string;
  sourceIp?: string;
  notificationSentAt?: string;
}

async function adminLogin(password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { token?: string };
    error?: { message?: string };
  };
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || "登入失敗");
  }
  if (!body.data?.token) throw new Error("回應缺少 token");
  return body.data.token;
}

async function fetchOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_URL}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: Order[];
    error?: { message?: string };
  };
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || "無法載入訂單");
  }
  return body.data ?? [];
}

const PlatformAdminPage: React.FC = () => {
  document.title = "平台管理後台";
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem("jkd_platform_admin_token"));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOrders = async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(t);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
      if (err instanceof Error && err.message.includes("token")) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadOrders(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const t = await adminLogin(password);
      localStorage.setItem("jkd_platform_admin_token", t);
      setToken(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jkd_platform_admin_token");
    setToken(null);
    setOrders([]);
    setSelectedOrder(null);
  };

  const handleViewOrder = async (order: Order) => {
    if (!token) return;
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await getAdminOrder(token, order.publicId) as OrderDetail;
      setSelectedOrder(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入詳情失敗");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRebuildPreview = (order: OrderDetail) => {
    if (order.generatedContent) {
      localStorage.setItem("yoware_generated_content", JSON.stringify(order.generatedContent));
    }
    window.open(`/preview?mode=generated&publicId=${order.publicId}`, "_blank");
  };

  const handleRegeneratePreview = async (order: OrderDetail) => {
    if (!order.briefAnswers) {
      setError("此訂單沒有客戶填寫資料，無法重新生成");
      return;
    }
    setDetailLoading(true);
    setError(null);
    try {
      const { generateContent } = await import("../../api/ai");
      const a = order.briefAnswers;
      const brief = [
        `# 客戶需求簡報`,
        ``,
        `行業別：${a.industry || "未提供"}`,
        `品牌名稱：${a.brandName || "未提供"}`,
        `品牌調性：${a.brandTone || "未提供"}`,
        `風格要求：${a.styleRequirements || "未提供"}`,
        `語言：${a.language || "繁體中文"}`,
        `核心賣點：`,
        ...(a.sellingPoints ? String(a.sellingPoints).split("\n") : ["未提供"]),
        `目標客群：${a.targetAudience || "未提供"}`,
        `聯絡方式：${a.siteContactMethod || "未提供"}`,
        `禁用詞：${a.forbiddenWords || "無"}`,
        `其他補充：${a.additionalNotes || "無"}`,
      ].join("\n");

      const generated = await generateContent(brief);
      localStorage.setItem("yoware_generated_content", JSON.stringify(generated.content));
      window.open(`/preview?mode=generated&publicId=${order.publicId}`, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新生成失敗");
    } finally {
      setDetailLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-jkd-black flex items-center justify-center p-4">
        <div className="bg-jkd-black-800 border border-jkd-gray-400/20 rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-jkd-gold mb-2">平台管理後台</h1>
          <p className="text-jkd-gray-300 mb-6">請輸入平台管理密碼</p>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-jkd-gray-400/30 rounded-lg bg-jkd-black-800 text-jkd-white focus:outline-none focus:ring-2 focus:ring-jkd-gold mb-4"
              placeholder="管理密碼"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-jkd-gold text-jkd-black rounded-lg font-bold hover:bg-jkd-gold-light transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "登入"}
            </button>
          </form>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1 text-jkd-gray-300 hover:text-jkd-gold transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> 返回主頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jkd-black text-jkd-white">
      <header className="bg-jkd-black-800 border-b border-jkd-gray-400/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-jkd-gold text-jkd-black rounded-full text-sm font-bold hover:bg-jkd-gold-light transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> 返回主頁
            </Link>
            <h1 className="text-xl font-bold text-jkd-gold">平台管理後台</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => token && loadOrders(token)}
              disabled={loading}
              className="p-2 text-jkd-gray-300 hover:text-jkd-gold transition-colors"
              title="重新整理"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 border border-jkd-gray-400 text-jkd-gray-300 rounded-lg hover:bg-jkd-gray-400/10 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" /> 登出
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-jkd-gold">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-jkd-gray-300">載入訂單中...</p>
          </div>
        ) : (
          <div className="bg-jkd-black-800 border border-jkd-gray-400/20 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-jkd-black-700 text-jkd-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">訂單編號</th>
                    <th className="px-6 py-4 font-semibold">客戶</th>
                    <th className="px-6 py-4 font-semibold">聯絡</th>
                    <th className="px-6 py-4 font-semibold">狀態</th>
                    <th className="px-6 py-4 font-semibold">提交時間</th>
                    <th className="px-6 py-4 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-jkd-gray-400/20">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-jkd-gray-300">
                        暫無訂單
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-jkd-black-700/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-jkd-gold">{order.publicId}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{order.customerName || "—"}</div>
                          <div className="text-jkd-gray-300 text-xs">{order.customerEmail || "—"}</div>
                        </td>
                        <td className="px-6 py-4 text-jkd-gray-300">
                          {order.customerWhatsapp || order.customerPhone || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-jkd-gray-300">
                          {new Date(order.createdAt).toLocaleString("zh-HK")}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewOrder(order)}
                            disabled={detailLoading}
                            className="inline-flex items-center gap-1 text-jkd-gold hover:text-jkd-gold-light transition-colors disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4" /> 查看
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-jkd-black-800 border border-jkd-gray-400/20 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jkd-gold">訂單詳情</h2>
              <div className="flex items-center gap-2">
                {selectedOrder.generatedContent ? (
                  <button
                    onClick={() => handleRebuildPreview(selectedOrder)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-jkd-gold text-jkd-black rounded-lg font-bold text-sm hover:bg-jkd-gold-light transition-colors"
                    title="復現客戶看到的 AI 生成預覽"
                  >
                    <ExternalLink className="w-4 h-4" />
                    復現預覽
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegeneratePreview(selectedOrder)}
                    disabled={detailLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-jkd-gold text-jkd-black rounded-lg font-bold text-sm hover:bg-jkd-gold-light transition-colors disabled:opacity-50"
                    title="用原始資料重新讓 AI 生成預覽"
                  >
                    <RefreshCw className={`w-4 h-4 ${detailLoading ? "animate-spin" : ""}`} />
                    重新生成預覽
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-jkd-gray-400 text-jkd-gray-300 rounded-lg hover:bg-jkd-gray-400/10 transition-colors text-sm"
                >
                  關閉
                </button>
              </div>
            </div>

            <table className="w-full text-sm mb-6">
              <tbody className="divide-y divide-jkd-gray-400/20">
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300 w-32">訂單編號</td>
                  <td className="py-3 font-mono text-jkd-gold">{selectedOrder.publicId}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300">狀態</td>
                  <td className="py-3">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                      {selectedOrder.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300">客戶姓名</td>
                  <td className="py-3">{selectedOrder.customerName || "—"}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300">電子郵件</td>
                  <td className="py-3">{selectedOrder.customerEmail || "—"}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300">電話</td>
                  <td className="py-3">{selectedOrder.customerPhone || "—"}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300">WhatsApp</td>
                  <td className="py-3">{selectedOrder.customerWhatsapp || "—"}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300">提交時間</td>
                  <td className="py-3">{new Date(selectedOrder.createdAt).toLocaleString("zh-HK")}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-jkd-gray-300">來源 IP</td>
                  <td className="py-3 font-mono text-xs">{selectedOrder.sourceIp || "—"}</td>
                </tr>
              </tbody>
            </table>

            {selectedOrder.briefAnswers && Object.keys(selectedOrder.briefAnswers).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-jkd-gold mb-3">客戶填寫資料</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-jkd-gray-400/20">
                      {Object.entries(selectedOrder.briefAnswers)
                        .filter(([key]) => key !== "_metadata")
                        .map(([key, value]) => (
                          <tr key={key}>
                            <td className="py-2 pr-4 text-jkd-gray-300 w-32 align-top">{key}</td>
                            <td className="py-2 whitespace-pre-wrap">{String(value)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="text-xs text-jkd-gray-300">
              預覽狀態：{selectedOrder.generatedContent ? "已儲存生成內容，可復現預覽" : "此為舊訂單，未儲存生成內容，可點「重新生成預覽」用 AI 重跑一次"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminPage;
