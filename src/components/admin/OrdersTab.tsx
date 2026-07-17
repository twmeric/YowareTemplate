import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2, X, Save, Calendar, User, FileText, MessageSquare, Package } from "lucide-react";
import { getOrders, getOrder, updateOrder, AdminAPIError, type Order, type OrderEvent } from "../../api/admin";

const STATUS_OPTIONS = ["pending", "reviewing", "accepted", "rejected", "completed", "cancelled"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "待處理",
  reviewing: "審核中",
  accepted: "已接受",
  rejected: "已拒絕",
  completed: "已完成",
  cancelled: "已取消",
};

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewing: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("zh-HK");
  } catch {
    return iso;
  }
}

function brandNameFrom(order: Order): string {
  const val = order.briefAnswers?.brandName;
  return typeof val === "string" && val ? val : "-";
}

function eventDescription(event: OrderEvent): string {
  if (event.event === "status_changed" && typeof event.payload === "object" && event.payload) {
    const p = event.payload as { from?: string; to?: string };
    return `狀態變更：${STATUS_LABELS[p.from || ""] || p.from || "?"} → ${STATUS_LABELS[p.to || ""] || p.to || "?"}`;
  }
  if (event.event === "note_added" && typeof event.payload === "object" && event.payload) {
    const p = event.payload as { notes?: string };
    return `新增備註：${p.notes || ""}`;
  }
  return event.event;
}

const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [editStatus, setEditStatus] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrders({ status: statusFilter || undefined, limit: 50, offset: 0 });
      setOrders(res.orders);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof AdminAPIError ? err.message : "載入訂單失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openDetail = async (order: Order) => {
    setSelected(order);
    setDetailLoading(true);
    setDetailError(null);
    setSaveMessage(null);
    try {
      const full = await getOrder(order.id);
      setSelected(full);
      setEditStatus(full.status);
      setEditNotes(full.ownerNotes || "");
    } catch (err) {
      setDetailError(err instanceof AdminAPIError ? err.message : "載入訂單詳情失敗");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload: { status?: string; ownerNotes?: string } = {};
      if (editStatus !== selected.status) payload.status = editStatus;
      if (editNotes !== (selected.ownerNotes || "")) payload.ownerNotes = editNotes;
      if (Object.keys(payload).length === 0) {
        setSaveMessage({ type: "success", text: "沒有變更" });
        setSaving(false);
        return;
      }
      await updateOrder(selected.id, payload);
      const full = await getOrder(selected.id);
      setSelected(full);
      setEditStatus(full.status);
      setEditNotes(full.ownerNotes || "");
      setOrders((prev) => prev.map((o) => (o.id === full.id ? full : o)));
      setSaveMessage({ type: "success", text: "儲存成功" });
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof AdminAPIError ? err.message : "儲存失敗" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold text-brand-green flex items-center gap-2">
          <Package className="w-5 h-5" />
          訂單管理
        </h2>
        <span className="text-sm text-gray-500">共 {total} 筆</span>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "" ? "bg-brand-green text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          全部
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? "bg-brand-green text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p>{error}</p>
            <button onClick={fetchOrders} className="text-sm underline mt-1">重試</button>
          </div>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
          目前沒有符合條件的訂單
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">訂單編號</th>
                  <th className="px-4 py-3 font-medium">客戶</th>
                  <th className="px-4 py-3 font-medium">品牌名稱</th>
                  <th className="px-4 py-3 font-medium">模板</th>
                  <th className="px-4 py-3 font-medium">狀態</th>
                  <th className="px-4 py-3 font-medium">建立時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openDetail(order)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{order.publicId}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customer.name || order.customer.email}</td>
                    <td className="px-4 py-3 text-gray-700">{brandNameFrom(order)}</td>
                    <td className="px-4 py-3 text-gray-700">{order.template?.name || "-"}</td>
                    <td className="px-4 py-3">{statusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => openDetail(order)}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{order.publicId}</span>
                  {statusBadge(order.status)}
                </div>
                <div className="text-sm text-gray-700 mb-1">{order.customer.name || order.customer.email}</div>
                <div className="text-sm text-gray-500 mb-1">品牌：{brandNameFrom(order)}</div>
                <div className="text-sm text-gray-500">模板：{order.template?.name || "-"}</div>
                <div className="text-xs text-gray-400 mt-2">{formatDate(order.createdAt)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-brand-green">{selected.publicId}</h3>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {detailLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                </div>
              )}

              {detailError && (
                <div className="p-4 rounded-lg bg-red-50 text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {detailError}
                </div>
              )}

              {!detailLoading && (
                <>
                  {/* Customer info */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> 客戶資訊
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 block text-xs">姓名</span>
                        {selected.customer.name || "-"}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 block text-xs">Email</span>
                        {selected.customer.email}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 block text-xs">電話</span>
                        {selected.customer.phone || "-"}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 block text-xs">WhatsApp</span>
                        {selected.customer.whatsapp || "-"}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 block text-xs">偏好聯絡方式</span>
                        {selected.customer.preferredContact || "-"}
                      </div>
                    </div>
                  </section>

                  {/* Brief answers */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> 需求簡答
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(selected.briefAnswers || {}).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-500 block text-xs mb-1">{key}</span>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap">
                            {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Timestamps */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> 時間
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 block text-xs">建立時間</span>
                        {formatDate(selected.createdAt)}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 block text-xs">更新時間</span>
                        {formatDate(selected.updatedAt)}
                      </div>
                    </div>
                  </section>

                  {/* Events history */}
                  {selected.events && selected.events.length > 0 && (
                    <section>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> 事件紀錄
                      </h4>
                      <div className="space-y-3">
                        {selected.events.map((event) => (
                          <div key={event.id} className="border-l-2 border-brand-green pl-3">
                            <div className="text-sm text-gray-900">{eventDescription(event)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {event.actor || "system"} · {formatDate(event.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Editable fields */}
                  <section className="border-t border-gray-100 pt-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">編輯</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">內部備註</label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                          placeholder="輸入內部備註..."
                        />
                      </div>
                    </div>

                    {saveMessage && (
                      <div
                        className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                          saveMessage.type === "error"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {saveMessage.type === "error" ? <AlertCircle className="w-4 h-4" /> : null}
                        {saveMessage.text}
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2 disabled:opacity-70"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "儲存中..." : "儲存"}
                      </button>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
