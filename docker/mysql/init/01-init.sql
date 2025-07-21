CREATE DATABASE IF NOT EXISTS milagro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE milagro;

CREATE USER IF NOT EXISTS 'milagro_user'@'%' IDENTIFIED BY 'milagro_password';
GRANT ALL PRIVILEGES ON milagro.* TO 'milagro_user'@'%';
FLUSH PRIVILEGES;

INSERT IGNORE INTO roles (code, name, description, createdAt, updatedAt) VALUES
('admin', 'Administrator', 'Full system access', NOW(), NOW()),
('user', 'User', 'Standard user access', NOW(), NOW());

INSERT IGNORE INTO permissions (code, name, description, createdAt, updatedAt) VALUES
('product.create', 'Create Product', 'Can create products', NOW(), NOW()),
('product.read', 'Read Product', 'Can view products', NOW(), NOW()),
('product.update', 'Update Product', 'Can update products', NOW(), NOW()),
('product.delete', 'Delete Product', 'Can delete products', NOW(), NOW()),
('order.create', 'Create Order', 'Can create orders', NOW(), NOW()),
('order.read', 'Read Order', 'Can view orders', NOW(), NOW()),
('order.update', 'Update Order', 'Can update orders', NOW(), NOW()),
('bid.create', 'Create Bid', 'Can place bids', NOW(), NOW()),
('bid.read', 'Read Bid', 'Can view bids', NOW(), NOW()),
('user.read', 'Read User', 'Can view users', NOW(), NOW()),
('user.update', 'Update User', 'Can update users', NOW(), NOW());

INSERT IGNORE INTO categories (name, description, createdAt, updatedAt) VALUES
('Electronics', 'Electronic devices and gadgets', NOW(), NOW()),
('Fashion', 'Clothing and accessories', NOW(), NOW()),
('Home & Garden', 'Home improvement and garden items', NOW(), NOW()),
('Sports', 'Sports equipment and accessories', NOW(), NOW()),
('Books', 'Books and publications', NOW(), NOW()),
('Collectibles', 'Collectible items and memorabilia', NOW(), NOW()); 