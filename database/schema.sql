-- ============================================================
-- Percha — Esquema v3
-- Novedades: canal de venta (local/live), precios por tier
-- (minorista/mayorista con hasta 3 cantidades), stock plano.
--
-- IMPORTANTE (hosting compartido / Hostinger):
-- La base de datos ya la creaste vos desde hPanel (Bases de datos),
-- así que este script NO crea ni borra la base — se importa
-- directamente "dentro" de la base que elegiste en phpMyAdmin.
-- Si lo corrés en local con MySQL Workbench, creá la base a mano
-- una vez ("CREATE DATABASE percha_db;") y seleccionala antes de
-- correr este script.
-- ============================================================

CREATE TABLE tenants (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(60)  NOT NULL UNIQUE,
  plan       ENUM('free','pro','premium') NOT NULL DEFAULT 'free',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id     INT NOT NULL,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','employee') NOT NULL DEFAULT 'employee',
  active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  name      VARCHAR(80) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY (tenant_id, name)
) ENGINE=InnoDB;

-- Producto plano: nombre, categoría, stock, activo.
-- Los precios viven en product_price_tiers.
CREATE TABLE products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id   INT NOT NULL,
  category_id INT NULL,
  name        VARCHAR(150) NOT NULL,
  stock       INT NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id)   REFERENCES tenants(id)    ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX (tenant_id)
) ENGINE=InnoDB;

-- Precios por tier: minorista o mayorista, para 1, 2 o 3 unidades.
-- El campo `price` es el TOTAL para esa cantidad (no precio unitario).
-- Ej: type=minorista, quantity=2, price=20000 => "2 por $20.000"
CREATE TABLE product_price_tiers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type       ENUM('minorista','mayorista') NOT NULL,
  quantity   INT NOT NULL,   -- 1, 2 o 3
  price      DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tier (product_id, type, quantity)
) ENGINE=InnoDB;

CREATE TABLE cash_sessions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id         INT NOT NULL,
  opened_by         INT NOT NULL,
  opening_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  opened_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_by         INT NULL,
  closing_amount    DECIMAL(12,2) NULL,
  expected_amount   DECIMAL(12,2) NULL,
  difference_amount DECIMAL(12,2) NULL,
  closed_at         DATETIME NULL,
  status            ENUM('abierta','cerrada') NOT NULL DEFAULT 'abierta',
  notes             VARCHAR(255) NULL,
  FOREIGN KEY (tenant_id)  REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (opened_by)  REFERENCES users(id),
  FOREIGN KEY (closed_by)  REFERENCES users(id),
  INDEX (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE sales (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id       INT NOT NULL,
  user_id         INT NOT NULL,
  cash_session_id INT NULL,
  channel         ENUM('local','live') NOT NULL DEFAULT 'local',
  payment_method  ENUM('efectivo','mercadopago','debito') NOT NULL DEFAULT 'efectivo',
  buyer_name      VARCHAR(120) NULL,   -- para ventas de live (nombre del cliente)
  buyer_contact   VARCHAR(120) NULL,   -- para ventas de live (Instagram/WhatsApp)
  total           DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id)       REFERENCES tenants(id)       ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id),
  FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE SET NULL,
  INDEX (tenant_id),
  INDEX (created_at),
  INDEX (channel)
) ENGINE=InnoDB;

-- Detalle de venta: precio_tipo y precio_tier registran qué precio se usó
CREATE TABLE sale_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  sale_id      INT NOT NULL,
  product_id   INT NOT NULL,
  quantity     INT NOT NULL,
  price_type   ENUM('minorista','mayorista') NOT NULL DEFAULT 'minorista',
  unit_price   DECIMAL(12,2) NOT NULL,  -- precio unitario resultante
  subtotal     DECIMAL(12,2) NOT NULL,  -- total de este ítem (del tier)
  FOREIGN KEY (sale_id)    REFERENCES sales(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX (sale_id)
) ENGINE=InnoDB;

CREATE TABLE expenses (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id       INT NOT NULL,
  user_id         INT NOT NULL,
  cash_session_id INT NULL,
  category        VARCHAR(60) NOT NULL,
  description     VARCHAR(255),
  payment_method  ENUM('efectivo','mercadopago','debito') NOT NULL DEFAULT 'efectivo',
  amount          DECIMAL(12,2) NOT NULL,
  expense_date    DATE NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id)       REFERENCES tenants(id)       ON DELETE CASCADE,
  FOREIGN KEY (user_id)         REFERENCES users(id),
  FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE SET NULL,
  INDEX (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE stock_movements (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id  INT NOT NULL,
  product_id INT NOT NULL,
  user_id    INT NOT NULL,
  type       ENUM('entrada','salida','ajuste','venta','compra') NOT NULL,
  quantity   INT NOT NULL,
  reason     VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  INDEX (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id    INT NOT NULL,
  name         VARCHAR(150) NOT NULL,
  contact_name VARCHAR(120) NULL,
  phone        VARCHAR(40) NULL,
  email        VARCHAR(150) NULL,
  notes        VARCHAR(255) NULL,
  active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id   INT NOT NULL,
  supplier_id INT NOT NULL,
  user_id     INT NOT NULL,
  status      ENUM('pendiente','recibida','cancelada') NOT NULL DEFAULT 'pendiente',
  total       DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_at DATETIME NULL,
  FOREIGN KEY (tenant_id)   REFERENCES tenants(id)   ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (user_id)     REFERENCES users(id),
  INDEX (tenant_id)
) ENGINE=InnoDB;

CREATE TABLE purchase_order_items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT NOT NULL,
  product_id        INT NOT NULL,
  quantity          INT NOT NULL,
  unit_cost         DECIMAL(12,2) NOT NULL,
  subtotal          DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)        REFERENCES products(id),
  INDEX (purchase_order_id)
) ENGINE=InnoDB;
