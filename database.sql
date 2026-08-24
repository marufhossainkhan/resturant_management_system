-- ==============================================================================
-- Restaurant Management System - Complete Database Script
-- Compatible with local MySQL, FreeDB, phpMyAdmin, DBeaver, MySQL Workbench
-- ==============================================================================

-- Optional database creation (uncomment if running on local root server):
-- CREATE DATABASE IF NOT EXISTS `restaurant` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `restaurant`;

-- Disable foreign key checks for clean table drops & recreation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `food_item`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

-- ------------------------------------------------------------------------------
-- 1. Table structure for `users`
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` ENUM('admin', 'manager', 'cashier', 'waiter', 'chef', 'customer') NOT NULL DEFAULT 'customer',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table structure for `categories`
-- ------------------------------------------------------------------------------
CREATE TABLE `categories` (
  `category_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(100) NOT NULL,
  `category_slug` VARCHAR(120) NOT NULL,
  `category_description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_slug` (`category_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table structure for `food_item`
-- ------------------------------------------------------------------------------
CREATE TABLE `food_item` (
  `food_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `descriptions` TEXT DEFAULT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`food_item_id`),
  KEY `idx_food_category` (`category_id`),
  CONSTRAINT `fk_food_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table structure for `orders`
-- ------------------------------------------------------------------------------
CREATE TABLE `orders` (
  `order_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_email` VARCHAR(150) DEFAULT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `delivery_address` VARCHAR(255) DEFAULT NULL,
  `table_no` VARCHAR(20) DEFAULT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('cash', 'card', 'online') NOT NULL DEFAULT 'cash',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table structure for `order_items`
-- ------------------------------------------------------------------------------
CREATE TABLE `order_items` (
  `order_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `food_item_id` INT UNSIGNED DEFAULT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`order_item_id`),
  KEY `idx_items_order` (`order_id`),
  KEY `idx_items_food` (`food_item_id`),
  CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_items_food` FOREIGN KEY (`food_item_id`) REFERENCES `food_item` (`food_item_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- SAMPLE SEED DATA
-- ==============================================================================

-- 1. Users (Admin, Staff, Customers)
INSERT INTO `users` (`user_id`, `full_name`, `email`, `password`, `phone`, `role`) VALUES
(1, 'System Administrator', 'admin@restaurant.com', 'admin123', '+8801700000001', 'admin'),
(2, 'Maruf Hossain', 'maruf@gmail.com', '1234567', '+8801811112233', 'customer'),
(3, 'Sadia Rahman', 'sadia@gmail.com', '1234567', '+8801922223344', 'customer'),
(4, 'Main Kitchen Chef', 'chef@restaurant.com', 'chef123', '+8801733334455', 'chef');

-- 2. Categories
INSERT INTO `categories` (`category_id`, `category_name`, `category_slug`, `category_description`) VALUES
(1, 'Burgers & Sandwiches', 'burgers-sandwiches', 'Gourmet handcrafted burgers, crispy chicken sandwiches, and loaded subs.'),
(2, 'Artisan Pizzas', 'artisan-pizzas', 'Freshly baked stone-oven pizzas with signature cheese blends and toppings.'),
(3, 'Main Courses', 'main-courses', 'Hearty chef-special steaks, pasta dishes, grilled salmon, and flavorful rice bowls.'),
(4, 'Appetizers & Starters', 'appetizers-starters', 'Crispy wings, loaded nachos, garlic bread, and fresh garden salads.'),
(5, 'Desserts & Sweets', 'desserts-sweets', 'Decadent chocolate lava cakes, cheesecakes, ice creams, and pastries.'),
(6, 'Beverages & Mocktails', 'beverages-mocktails', 'Refreshing iced drinks, artisan coffees, fresh fruit smoothies, and mocktails.');

-- 3. Food Items
INSERT INTO `food_item` (`food_item_id`, `category_id`, `item_name`, `descriptions`, `price`, `image_url`, `is_available`) VALUES
(1, 1, 'Classic Double Beef Burger', 'Juicy double Angus beef patties with melted cheddar, crisp lettuce, tomato, pickles, and signature house sauce.', 320.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', 1),
(2, 1, 'Crispy Hot Chicken Burger', 'Golden crunchy spiced chicken breast tossed in spicy garlic sauce, topped with creamy slaw on a brioche bun.', 260.00, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80', 1),
(3, 2, 'Margherita Deluxe Pizza', 'Stone-baked thin crust pizza with San Marzano tomato sauce, fresh mozzarella, fresh basil, and extra virgin olive oil.', 480.00, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80', 1),
(4, 2, 'Spicy Pepperoni & Beef Pizza', 'Loaded with premium sliced Italian pepperoni, seasoned ground beef, jalapeños, and extra mozzarella cheese.', 580.00, 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80', 1),
(5, 3, 'Grilled Norwegian Salmon', 'Pan-seared Atlantic salmon fillet served with lemon butter herb sauce, garlic mashed potatoes, and sautéed greens.', 750.00, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&auto=format&fit=crop&q=80', 1),
(6, 3, 'Creamy Fettuccine Alfredo', 'Al dente pasta tossed in rich garlic parmesan cream sauce, topped with grilled chicken breast and fresh parsley.', 390.00, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80', 1),
(7, 4, 'Crispy Buffalo Chicken Wings', '8 pcs jumbo chicken wings glazed in spicy tangy buffalo sauce, served with cool ranch dipping sauce.', 290.00, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80', 1),
(8, 4, 'Loaded Cheesy Nachos', 'Crispy corn tortilla chips baked with melted Monterey Jack cheese, black beans, guacamole, sour cream, and pico de gallo.', 250.00, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop&q=80', 1),
(9, 5, 'Molten Chocolate Lava Cake', 'Warm chocolate fudge cake with a rich molten center, served with vanilla bean ice cream and berry coulis.', 220.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80', 1),
(10, 6, 'Fresh Mint Mojito', 'Crushed fresh spearmint leaves, zesty lime wedges, simple syrup, and sparkling soda over crushed ice.', 150.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', 1);

-- 4. Sample Orders
INSERT INTO `orders` (`order_id`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `delivery_address`, `table_no`, `total_amount`, `status`, `payment_status`, `payment_method`, `notes`) VALUES
(101, 2, 'Maruf Hossain', 'maruf@gmail.com', '+8801811112233', 'Dhanmondi 27, Dhaka', 'Table 4', 900.00, 'delivered', 'paid', 'cash', 'Please add extra napkins.'),
(102, 3, 'Sadia Rahman', 'sadia@gmail.com', '+8801922223344', 'Gulshan 2, Road 45, Dhaka', 'Table 8', 730.00, 'preparing', 'paid', 'card', 'Less spicy wings please.'),
(103, NULL, 'Walk-in Guest', 'guest@resto.com', '+8801755556677', 'Restaurant Dine-in', 'Table 2', 470.00, 'pending', 'pending', 'cash', 'Serve hot drinks first.');

-- 5. Sample Order Items
INSERT INTO `order_items` (`order_item_id`, `order_id`, `food_item_id`, `item_name`, `unit_price`, `quantity`, `subtotal`) VALUES
(1, 101, 1, 'Classic Double Beef Burger', 320.00, 2, 640.00),
(2, 101, 2, 'Crispy Hot Chicken Burger', 260.00, 1, 260.00),
(3, 102, 3, 'Margherita Deluxe Pizza', 480.00, 1, 480.00),
(4, 102, 8, 'Loaded Cheesy Nachos', 250.00, 1, 250.00),
(5, 103, 1, 'Classic Double Beef Burger', 320.00, 1, 320.00),
(6, 103, 10, 'Fresh Mint Mojito', 150.00, 1, 150.00);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
