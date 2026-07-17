PRAGMA foreign_keys = ON;

-- 為 orders 表新增自動開站所需欄位
ALTER TABLE orders ADD COLUMN desired_domain TEXT;
ALTER TABLE orders ADD COLUMN tweak_request TEXT;
ALTER TABLE orders ADD COLUMN generated_content TEXT;
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending','paid','refunded'));

-- 擴充 orders.status 允許值（D1/SQLite 不支援修改 CHECK，此處僅供文件參考）
-- 實際部署時建議重建 orders 表或於應用層驗證狀態：
-- pending, reviewing, accepted, paid, provisioning, completed, failed, rejected, cancelled

-- 客戶網站表：記錄自動開站產生的客戶網站實例
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  repo_name TEXT NOT NULL,
  pages_project_name TEXT,
  pages_domain TEXT,
  custom_domain TEXT,
  r2_bucket_name TEXT,
  admin_worker_url TEXT,
  live_url TEXT,
  status TEXT DEFAULT 'provisioning'
    CHECK (status IN ('provisioning','live','failed','suspended','archived')),
  provisioning_logs TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE INDEX IF NOT EXISTS idx_sites_order ON sites(order_id);
CREATE INDEX IF NOT EXISTS idx_sites_customer ON sites(customer_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
