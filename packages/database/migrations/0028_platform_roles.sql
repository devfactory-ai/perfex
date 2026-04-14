-- Platform Roles Migration
-- Adds platform-level roles for super admin and admin functionality

-- Add platform_role column to users table
-- Values: 'super_admin', 'admin', 'user' (default)
ALTER TABLE users ADD COLUMN platform_role TEXT DEFAULT 'user' NOT NULL;

-- Create index for quick role lookups
CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role);
