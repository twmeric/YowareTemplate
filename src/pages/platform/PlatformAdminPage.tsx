import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Eye,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { PlatformAPIError } from "../../api/platform";

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
  const [token, setToken] = useState<string | null>(localStorage.getItem("jkd_platform_admin_token"));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 text-jkd-gold hover:text-jkd-gold-light transition-colors"
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
            className="bg-jkd-black-800 border border-jkd-gray-400/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-jkd-gold">訂單詳情</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-jkd-gray-300 hover:text-jkd-white transition-colors"
              >
                關閉
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-jkd-gray-300">訂單編號</span>
                  <p className="font-mono text-jkd-gold">{selectedOrder.publicId}</p>
                </div>
                <div>
                  <span className="text-jkd-gray-300">狀態</span>
                  <p>{selectedOrder.status}</p>
                </div>
                <div>
                  <span className="text-jkd-gray-300">姓名</span>
                  <p>{selectedOrder.customerName || "—"}</p>
                </div>
                <div>
                  <span className="text-jkd-gray-300">電子郵件</span>
                  <p>{selectedOrder.customerEmail || "—"}</p>
                </div>
                <div>
                  <span className="text-jkd-gray-300">電話</span>
                  <p>{selectedOrder.customerPhone || "—"}</p>
                </div>
                <div>
                  <span className="text-jkd-gray-300">WhatsApp</span>
                  <p>{selectedOrder.customerWhatsapp || "—"}</p>
                </div>
              </div>
              <div>
                <span className="text-jkd-gray-300">提交時間</span>
                <p>{new Date(selectedOrder.createdAt).toLocaleString("zh-HK")}</p>
              </div>
              {selectedOrder.briefAnswers && (
                <div>
                  <span className="text-jkd-gray-300">客戶填寫資料</span>
                  <pre className="mt-2 p-4 bg-jkd-black-700 rounded-lg overflow-x-auto text-xs text-jkd-gray-200">
                    {JSON.stringify(selectedOrder.briefAnswers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminPage;
