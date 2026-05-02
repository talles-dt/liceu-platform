-- Create admin_login_attempts table
CREATE TABLE admin_login_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- Create admin_access_logs table
CREATE TABLE admin_access_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
  ip TEXT,
  user_agent TEXT,
  action TEXT NOT NULL,
  metadata JSONB
);

-- Add indexes for better performance
CREATE INDEX idx_admin_login_attempts_email ON admin_login_attempts(email);
CREATE INDEX idx_admin_login_attempts_timestamp ON admin_login_attempts(timestamp);
CREATE INDEX idx_admin_access_logs_path ON admin_access_logs(path);
CREATE INDEX idx_admin_access_logs_timestamp ON admin_access_logs(timestamp);
CREATE INDEX idx_admin_access_logs_user_id ON admin_access_logs(user_id);