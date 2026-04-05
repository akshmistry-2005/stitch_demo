-- GymFlow SaaS - Complete Database Schema
-- MySQL 8.4 Compatible
-- Multi-tenant architecture with strict data isolation

USE railway;

-- ============================================
-- CORE TENANT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gyms (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ADMIN USERS (gym owners/managers)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role ENUM('owner', 'manager', 'staff_admin') DEFAULT 'owner',
    google_id VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_admin_tenant (tenant_id),
    INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GYM MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS gym_members (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    unique_member_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    height_cm DECIMAL(5,1),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_member_tenant (tenant_id),
    INDEX idx_member_unique_id (unique_member_id),
    INDEX idx_member_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STAFF MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS staff_members (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    unique_staff_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_staff_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRAINERS
-- ============================================
CREATE TABLE IF NOT EXISTS trainers (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    specialization VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_trainer_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRAINER ASSIGNMENTS (1 trainer -> many members, 1 member -> 1 trainer)
-- ============================================
CREATE TABLE IF NOT EXISTS trainer_assignments (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    trainer_id CHAR(36) NOT NULL,
    member_id CHAR(36) NOT NULL UNIQUE,
    assigned_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES gym_members(id) ON DELETE CASCADE,
    INDEX idx_assign_tenant (tenant_id),
    INDEX idx_assign_trainer (trainer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WORKOUT CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS workout_categories (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    trainer_guidance VARCHAR(500),
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_wcat_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WORKOUT EXERCISES
-- ============================================
CREATE TABLE IF NOT EXISTS workout_exercises (
    id CHAR(36) PRIMARY KEY,
    category_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    exercise_name VARCHAR(255) NOT NULL,
    sets_count INT NOT NULL DEFAULT 3,
    repetitions INT NOT NULL DEFAULT 10,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES workout_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_wex_category (category_id),
    INDEX idx_wex_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DIET CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS diet_categories (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_dcat_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DIET PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS diet_plans (
    id CHAR(36) PRIMARY KEY,
    category_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES diet_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_dplan_category (category_id),
    INDEX idx_dplan_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DIET MEALS
-- ============================================
CREATE TABLE IF NOT EXISTS diet_meals (
    id CHAR(36) PRIMARY KEY,
    plan_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    meal_name VARCHAR(255) NOT NULL DEFAULT 'Meal 1',
    meal_time TIME,
    food_details TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_dmeal_plan (plan_id),
    INDEX idx_dmeal_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    is_competition BOOLEAN DEFAULT FALSE,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_event_tenant (tenant_id),
    INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- EVENT PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS event_photos (
    id CHAR(36) PRIMARY KEY,
    event_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    file_path TEXT NOT NULL,
    original_name VARCHAR(255),
    uploaded_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_photo_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- COMPETITION WINNERS
-- ============================================
CREATE TABLE IF NOT EXISTS competition_winners (
    id CHAR(36) PRIMARY KEY,
    event_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    position ENUM('1st', '2nd', '3rd') NOT NULL,
    winner_name VARCHAR(255) NOT NULL,
    member_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_winner_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SONG REQUESTS (Real-time queue)
-- ============================================
CREATE TABLE IF NOT EXISTS song_requests (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    song_title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    requested_by VARCHAR(255) NOT NULL,
    queue_position INT,
    status ENUM('queued', 'playing', 'played', 'skipped') DEFAULT 'queued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_song_tenant_status (tenant_id, status),
    INDEX idx_song_queue (tenant_id, queue_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVITE / EMAIL LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS invite_logs (
    id CHAR(36) PRIMARY KEY,
    tenant_id CHAR(36) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_type ENUM('member', 'staff') NOT NULL,
    unique_id_sent VARCHAR(20) NOT NULL,
    status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES gyms(id) ON DELETE CASCADE,
    INDEX idx_invite_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
