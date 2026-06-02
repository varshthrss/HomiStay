-- =============================================
-- Homistay Database Schema
-- Run this ONCE after creating the database
-- =============================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    bio           TEXT,
    dob           DATE,
    gender        VARCHAR(30),
    avatar_url    TEXT,
    role          VARCHAR(20)  NOT NULL DEFAULT 'GUEST'
                    CHECK (role IN ('GUEST','HOST','ADMIN')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Add columns if table already exists (safe migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(30);

-- PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
    id               BIGSERIAL PRIMARY KEY,
    host_id          BIGINT       NOT NULL REFERENCES users(id),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    type             VARCHAR(50)  NOT NULL,
    city             VARCHAR(100) NOT NULL,
    country          VARCHAR(100) NOT NULL,
    address          TEXT,
    latitude         DECIMAL(9,6),
    longitude        DECIMAL(9,6),
    price_per_night  DECIMAL(10,2) NOT NULL,
    max_guests       INT          NOT NULL DEFAULT 1,
    bedrooms         INT          NOT NULL DEFAULT 1,
    bathrooms        INT          NOT NULL DEFAULT 1,
    amenities        TEXT,
    allows_children  BOOLEAN      NOT NULL DEFAULT TRUE,
    allows_infants   BOOLEAN      NOT NULL DEFAULT TRUE,
    allows_pets      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- PROPERTY IMAGES
CREATE TABLE IF NOT EXISTS property_images (
    id            BIGSERIAL PRIMARY KEY,
    property_id   BIGINT  NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url           TEXT    NOT NULL,
    is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT     NOT NULL DEFAULT 0
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id            BIGSERIAL PRIMARY KEY,
    guest_id      BIGINT        NOT NULL REFERENCES users(id),
    property_id   BIGINT        NOT NULL REFERENCES properties(id),
    check_in      DATE          NOT NULL,
    check_out     DATE          NOT NULL,
    guests_count  INT           NOT NULL DEFAULT 1,
    total_price   DECIMAL(10,2) NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','COMPLETED')),
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    adults        INT           NOT NULL DEFAULT 1,
    children      INT           NOT NULL DEFAULT 0,
    infants       INT           NOT NULL DEFAULT 0,
    pets          INT           NOT NULL DEFAULT 0,
    CONSTRAINT chk_dates CHECK (check_out > check_in)
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id           BIGSERIAL PRIMARY KEY,
    booking_id   BIGINT    NOT NULL UNIQUE REFERENCES bookings(id),
    reviewer_id  BIGINT    NOT NULL REFERENCES users(id),
    property_id  BIGINT    NOT NULL REFERENCES properties(id),
    rating       INT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AVAILABILITY (blocked dates per property)
CREATE TABLE IF NOT EXISTS availability (
    id           BIGSERIAL PRIMARY KEY,
    property_id  BIGINT      NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    date         DATE        NOT NULL,
    is_available BOOLEAN     NOT NULL DEFAULT FALSE,
    reason       VARCHAR(100) CHECK (reason IN ('BOOKED','HOST_BLOCKED')),
    UNIQUE (property_id, date)
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id             BIGSERIAL PRIMARY KEY,
    booking_id     BIGINT        NOT NULL UNIQUE REFERENCES bookings(id),
    amount         DECIMAL(10,2) NOT NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','PAID','REFUNDED','FAILED')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    paid_at        TIMESTAMP
);

-- EXPERIENCES
CREATE TABLE IF NOT EXISTS experiences (
    id                BIGSERIAL PRIMARY KEY,
    host_id           BIGINT        NOT NULL REFERENCES users(id),
    title             VARCHAR(255)  NOT NULL,
    description       TEXT,
    price_per_person  DECIMAL(10,2) NOT NULL,
    duration_hours    DECIMAL(4,1)  NOT NULL,
    city              VARCHAR(100)  NOT NULL,
    max_participants  INT           NOT NULL DEFAULT 10,
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE
);

-- BOOKING EXPERIENCES
CREATE TABLE IF NOT EXISTS booking_experiences (
    id            BIGSERIAL PRIMARY KEY,
    guest_id      BIGINT        NOT NULL REFERENCES users(id),
    experience_id BIGINT        NOT NULL REFERENCES experiences(id),
    booking_date  DATE          NOT NULL,
    participants  INT           NOT NULL DEFAULT 1,
    total_price   DECIMAL(10,2) NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'CONFIRMED'
                    CHECK (status IN ('CONFIRMED','CANCELLED'))
);

-- INDEXES (for performance)
CREATE INDEX IF NOT EXISTS idx_properties_host      ON properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_city      ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_active    ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_guest       ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property    ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates       ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_availability_prop    ON availability(property_id, date);
CREATE INDEX IF NOT EXISTS idx_reviews_property     ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_experiences_host     ON experiences(host_id);

-- MIGRATIONS & NEW TABLES (ADDED FOR WISHLIST, HOUSE RULES & SPECIAL REQUESTS)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;

CREATE TABLE IF NOT EXISTS wishlists (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

-- FEATURE 5: Guest Requirements
ALTER TABLE properties ADD COLUMN IF NOT EXISTS guest_requirements TEXT;

-- FEATURE 1: Check-in Instructions
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_instructions TEXT;

-- FEATURE 3: Special Request Status
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_request_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_special_request_status;
ALTER TABLE bookings ADD CONSTRAINT chk_special_request_status CHECK (special_request_status IN ('PENDING','ACCEPTED','DECLINED','NOTED'));

-- FEATURE 2: Host Notes
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_notes TEXT;

-- FEATURE 4: Extra Services / Add-ons
CREATE TABLE IF NOT EXISTS property_addons (
    id          BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_addons (
    id         BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    addon_id   BIGINT NOT NULL REFERENCES property_addons(id),
    quantity   INT NOT NULL DEFAULT 1,
    price      DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_property_addons_prop ON property_addons(property_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_book ON booking_addons(booking_id);

-- FEATURE 6: Booking Modification Requests
CREATE TABLE IF NOT EXISTS booking_modifications (
    id              BIGSERIAL PRIMARY KEY,
    booking_id      BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    requested_by    BIGINT NOT NULL REFERENCES users(id),
    new_check_in    DATE,
    new_check_out   DATE,
    new_guests      INT,
    reason          TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
    host_response   TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_mods_booking ON booking_modifications(booking_id);

-- BOOKING MESSAGES (guest-host private messaging per booking)
CREATE TABLE IF NOT EXISTS booking_messages (
    id          BIGSERIAL PRIMARY KEY,
    booking_id  BIGINT      NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id   BIGINT      NOT NULL REFERENCES users(id),
    message     TEXT        NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking ON booking_messages(booking_id);

-- CHAT QUERIES (Whirly chatbot logs)
CREATE TABLE IF NOT EXISTS chat_queries (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT        REFERENCES users(id),
    user_name        VARCHAR(255),
    question         TEXT          NOT NULL,
    chatbot_response TEXT          NOT NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT        NOT NULL REFERENCES users(id),
    issue_type        VARCHAR(50)   NOT NULL,
    issue_description TEXT          NOT NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'OPEN'
                        CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    assigned_to       BIGINT        REFERENCES users(id),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_queries_user ON chat_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- SEASONAL RATES (dynamic pricing — season based)
CREATE TABLE IF NOT EXISTS seasonal_rates (
    id               BIGSERIAL PRIMARY KEY,
    property_id      BIGINT        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name             VARCHAR(255)  NOT NULL,
    start_date       DATE          NOT NULL,
    end_date         DATE          NOT NULL,
    price_multiplier DECIMAL(4,2)  NOT NULL DEFAULT 1.00,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_seasonal_rates_property ON seasonal_rates(property_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_rates_dates   ON seasonal_rates(property_id, start_date, end_date);

-- DYNAMIC PRICING CONFIG (demand-based pricing settings per property)
CREATE TABLE IF NOT EXISTS dynamic_pricing_configs (
    id                  BIGSERIAL PRIMARY KEY,
    property_id         BIGINT        NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
    enabled             BOOLEAN       NOT NULL DEFAULT FALSE,
    min_price_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    max_price_multiplier DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    demand_threshold    INT          NOT NULL DEFAULT 5,
    lookback_months     INT          NOT NULL DEFAULT 3,
    updated_at          TIMESTAMP
);

-- SUPPORT ROLE MIGRATION (safe migration for users table check constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('GUEST','HOST','ADMIN','SUPPORT_TEAM'));

-- Safe migration: add missing columns to properties if they don't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS allows_children BOOLEAN DEFAULT TRUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS allows_infants BOOLEAN DEFAULT TRUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS allows_pets BOOLEAN DEFAULT FALSE;

-- Safe migration: add missing columns to bookings if they don't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adults INT DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS children INT DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS infants INT DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pets INT DEFAULT 0;

-- Safe migration: update payments status check constraint to include PARTIALLY_REFUNDED
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_payments_status;
ALTER TABLE payments ADD CONSTRAINT chk_payments_status CHECK (status IN ('PENDING','PAID','REFUNDED','PARTIALLY_REFUNDED','FAILED'));


