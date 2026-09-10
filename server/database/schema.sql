-- ============================================================
-- CAMPUS LOST & FOUND MANAGEMENT SYSTEM
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS campus_lost_and_found
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE campus_lost_and_found;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    student_number VARCHAR(50) UNIQUE,

    email VARCHAR(100) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM(
        'student',
        'staff',
        'admin',
        'super_admin'
    ) NOT NULL DEFAULT 'student',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. CATEGORIES
-- ============================================================

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. LOST ITEMS
-- ============================================================

CREATE TABLE lost_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    category_id INT NOT NULL,

    item_name VARCHAR(150) NOT NULL,

    description TEXT NOT NULL,

    brand VARCHAR(100),

    colour VARCHAR(50),

    identifying_features TEXT,

    location_lost VARCHAR(255) NOT NULL,

    date_lost DATE NOT NULL,

    status ENUM(
        'lost',
        'matched',
        'found',
        'claimed',
        'closed'
    ) NOT NULL DEFAULT 'lost',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_lost_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_lost_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    INDEX idx_lost_user (user_id),
    INDEX idx_lost_category (category_id),
    INDEX idx_lost_status (status),
    INDEX idx_lost_date (date_lost),
    INDEX idx_lost_location (location_lost)
);


-- ============================================================
-- 4. FOUND ITEMS
-- ============================================================

CREATE TABLE found_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    category_id INT NOT NULL,

    item_name VARCHAR(150) NOT NULL,

    description TEXT NOT NULL,

    brand VARCHAR(100),

    colour VARCHAR(50),

    identifying_features TEXT,

    location_found VARCHAR(255) NOT NULL,

    date_found DATE NOT NULL,

    status ENUM(
        'found',
        'matched',
        'claimed',
        'returned',
        'closed'
    ) NOT NULL DEFAULT 'found',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_found_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_found_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    INDEX idx_found_user (user_id),
    INDEX idx_found_category (category_id),
    INDEX idx_found_status (status),
    INDEX idx_found_date (date_found),
    INDEX idx_found_location (location_found)
);


-- ============================================================
-- 5. ITEM IMAGES
-- ============================================================

CREATE TABLE item_images (
    id INT AUTO_INCREMENT PRIMARY KEY,

    lost_item_id INT NULL,

    found_item_id INT NULL,

    image_url VARCHAR(500) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_image_lost
        FOREIGN KEY (lost_item_id)
        REFERENCES lost_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_image_found
        FOREIGN KEY (found_item_id)
        REFERENCES found_items(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_image_item
        CHECK (
            (lost_item_id IS NOT NULL AND found_item_id IS NULL)
            OR
            (lost_item_id IS NULL AND found_item_id IS NOT NULL)
        ),

    INDEX idx_image_lost (lost_item_id),
    INDEX idx_image_found (found_item_id)
);


-- ============================================================
-- 6. MATCHES
-- ============================================================

CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,

    lost_item_id INT NOT NULL,

    found_item_id INT NOT NULL,

    match_score DECIMAL(5,2),

    status ENUM(
        'suggested',
        'confirmed',
        'rejected'
    ) NOT NULL DEFAULT 'suggested',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_match_lost
        FOREIGN KEY (lost_item_id)
        REFERENCES lost_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_match_found
        FOREIGN KEY (found_item_id)
        REFERENCES found_items(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_lost_found_match
        UNIQUE (lost_item_id, found_item_id),

    CONSTRAINT chk_match_score
        CHECK (
            match_score IS NULL
            OR (match_score >= 0 AND match_score <= 100)
        ),

    INDEX idx_match_lost (lost_item_id),
    INDEX idx_match_found (found_item_id),
    INDEX idx_match_status (status)
);


-- ============================================================
-- 7. CLAIMS
-- ============================================================

CREATE TABLE claims (
    id INT AUTO_INCREMENT PRIMARY KEY,

    found_item_id INT NOT NULL,

    user_id INT NOT NULL,

    match_id INT NULL,

    claim_description TEXT NOT NULL,

    verification_notes TEXT,

    status ENUM(
        'pending',
        'approved',
        'rejected',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    reviewed_by INT NULL,

    reviewed_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_claim_found
        FOREIGN KEY (found_item_id)
        REFERENCES found_items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_claim_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_claim_match
        FOREIGN KEY (match_id)
        REFERENCES matches(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_claim_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_claim_found (found_item_id),
    INDEX idx_claim_user (user_id),
    INDEX idx_claim_status (status),
    INDEX idx_claim_reviewer (reviewed_by)
);


-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,

    message TEXT NOT NULL,

    type ENUM(
        'match',
        'claim',
        'system',
        'status_update'
    ) NOT NULL DEFAULT 'system',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_created (created_at)
);


-- ============================================================
-- 9. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id INT NULL,

    description TEXT,

    ip_address VARCHAR(45),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
);