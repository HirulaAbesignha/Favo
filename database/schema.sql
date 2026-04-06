-- FAVO Database Schema aligned to the project ERD

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_pickup;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS design_images;
DROP TABLE IF EXISTS designs;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS pickup_locations;
DROP TABLE IF EXISTS users;

-- Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Showcase
CREATE TABLE collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL
);

CREATE TABLE designs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_designs_collection
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE design_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    design_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_design_images_design
        FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE CASCADE
);

-- Store
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(20) NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    sku VARCHAR(100) NULL,
    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_product_variant UNIQUE (product_id, size)
);

-- Cart
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    qty INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Fulfilment
CREATE TABLE pickup_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    delivery_method ENUM('DELIVERY', 'PICKUP') NOT NULL,
    status ENUM('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'READY', 'DELIVERED', 'PICKED_UP', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NULL,
    city VARCHAR(120) NOT NULL,
    postal_code VARCHAR(40) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    CONSTRAINT fk_addresses_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE order_pickup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    pickup_location_id INT NOT NULL,
    CONSTRAINT fk_order_pickup_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_pickup_location
        FOREIGN KEY (pickup_location_id) REFERENCES pickup_locations(id) ON DELETE RESTRICT
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    qty INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    method ENUM('SIMULATED_CARD', 'COD') NOT NULL,
    status ENUM('PAID', 'FAILED', 'PENDING') NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample showcase data
INSERT INTO collections (name, description) VALUES
('Signature Looks', 'Editorial concepts and campaign-ready fashion directions');

INSERT INTO designs (collection_id, title, description) VALUES
(1, 'Urban Tailoring', 'Premium styling direction for the apparel catalog');

INSERT INTO design_images (design_id, image_url, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1);

-- Sample categories
INSERT INTO categories (name) VALUES
('T-Shirts'),
('Jeans'),
('Dresses'),
('Jackets'),
('Shorts'),
('Activewear'),
('Shirts'),
('Shoes');

-- Sample products
INSERT INTO products (category_id, name, description, price) VALUES
(1, 'Classic White Tee', 'Premium cotton classic fit white t-shirt', 29.99),
(1, 'Graphic Print T-Shirt', 'Trendy graphic print crew neck t-shirt', 34.99),
(1, 'V-Neck Black Tee', 'Slim fit v-neck t-shirt in black', 32.99),
(2, 'Slim Fit Blue Jeans', 'Classic slim fit denim jeans', 59.99),
(2, 'Distressed Black Jeans', 'Modern distressed black denim', 64.99),
(2, 'Vintage Wash Jeans', 'Relaxed fit vintage wash jeans', 54.99),
(3, 'Floral Summer Dress', 'Light and breezy floral print dress', 49.99),
(3, 'Little Black Dress', 'Elegant little black frock with a sleek evening silhouette', 79.99),
(3, 'Maxi Dress', 'Bohemian style maxi dress', 69.99),
(5, 'Utility Cargo Shorts', 'Premium utility shorts with everyday comfort', 44.99),
(7, 'Linen Oxford Shirt', 'Breathable linen-blend shirt for smart casual wear', 52.99),
(7, 'Midnight Formal Shirt', 'Sharp black formal shirt with a modern cut', 57.99),
(8, 'Minimal White Sneakers', 'Clean low-top sneakers with a premium finish', 89.99),
(8, 'Classic Leather Derbies', 'Polished leather shoes for elevated everyday style', 109.99);

-- Product images
INSERT INTO product_images (product_id, image_url, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(3, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(4, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(5, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(6, 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(7, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(8, 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(9, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(10, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(11, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(12, 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(13, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1),
(14, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&fm=jpg&q=80&w=1200', 1);

-- Product variants
INSERT INTO product_variants (product_id, size, stock_qty, sku) VALUES
(1, 'S', 50, 'TEE-WHT-S'),
(1, 'M', 75, 'TEE-WHT-M'),
(1, 'L', 60, 'TEE-WHT-L'),
(1, 'XL', 40, 'TEE-WHT-XL'),
(2, 'S', 30, 'TEE-GRP-S'),
(2, 'M', 45, 'TEE-GRP-M'),
(2, 'L', 35, 'TEE-GRP-L'),
(2, 'XL', 25, 'TEE-GRP-XL'),
(3, 'S', 40, 'TEE-BLK-S'),
(3, 'M', 60, 'TEE-BLK-M'),
(3, 'L', 50, 'TEE-BLK-L'),
(3, 'XL', 30, 'TEE-BLK-XL'),
(4, 'S', 20, 'JNS-BLU-S'),
(4, 'M', 35, 'JNS-BLU-M'),
(4, 'L', 30, 'JNS-BLU-L'),
(4, 'XL', 15, 'JNS-BLU-XL'),
(5, 'S', 15, 'JNS-DSB-S'),
(5, 'M', 25, 'JNS-DSB-M'),
(5, 'L', 20, 'JNS-DSB-L'),
(5, 'XL', 10, 'JNS-DSB-XL'),
(6, 'S', 25, 'JNS-VTG-S'),
(6, 'M', 40, 'JNS-VTG-M'),
(6, 'L', 35, 'JNS-VTG-L'),
(6, 'XL', 20, 'JNS-VTG-XL'),
(7, 'XS', 15, 'DRS-FLR-XS'),
(7, 'S', 25, 'DRS-FLR-S'),
(7, 'M', 30, 'DRS-FLR-M'),
(7, 'L', 20, 'DRS-FLR-L'),
(8, 'XS', 10, 'DRS-BLK-XS'),
(8, 'S', 20, 'DRS-BLK-S'),
(8, 'M', 25, 'DRS-BLK-M'),
(8, 'L', 15, 'DRS-BLK-L'),
(9, 'XS', 12, 'DRS-MXI-XS'),
(9, 'S', 22, 'DRS-MXI-S'),
(9, 'M', 28, 'DRS-MXI-M'),
(9, 'L', 18, 'DRS-MXI-L'),
(10, 'S', 20, 'SHT-CRG-S'),
(10, 'M', 28, 'SHT-CRG-M'),
(10, 'L', 24, 'SHT-CRG-L'),
(10, 'XL', 16, 'SHT-CRG-XL'),
(11, 'S', 18, 'SHR-LIN-S'),
(11, 'M', 26, 'SHR-LIN-M'),
(11, 'L', 23, 'SHR-LIN-L'),
(11, 'XL', 14, 'SHR-LIN-XL'),
(12, 'S', 15, 'SHR-MID-S'),
(12, 'M', 22, 'SHR-MID-M'),
(12, 'L', 20, 'SHR-MID-L'),
(12, 'XL', 12, 'SHR-MID-XL'),
(13, '40', 18, 'SHO-SNK-40'),
(13, '41', 24, 'SHO-SNK-41'),
(13, '42', 19, 'SHO-SNK-42'),
(13, '43', 13, 'SHO-SNK-43'),
(14, '40', 10, 'SHO-DRB-40'),
(14, '41', 14, 'SHO-DRB-41'),
(14, '42', 12, 'SHO-DRB-42'),
(14, '43', 8, 'SHO-DRB-43');

-- Sample pickup locations
INSERT INTO pickup_locations (name, address, phone) VALUES
('FAVO Colombo Pickup', '12 Fashion Avenue, Colombo 03', '+94 11 555 0100'),
('FAVO Kandy Pickup', '45 Hill Street, Kandy', '+94 81 555 0130');
