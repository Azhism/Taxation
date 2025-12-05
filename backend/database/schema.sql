-- AI Tax Filing Platform - Database Schema
-- PostgreSQL Database Setup

-- Create database (run this first as postgres superuser)
-- CREATE DATABASE tax_filing_db;

-- Connect to the database
-- \c tax_filing_db;

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'uploaded',
  CONSTRAINT fk_user
    FOREIGN KEY(user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Tax forms table (for future use)
CREATE TABLE IF NOT EXISTS tax_forms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  tax_year INTEGER NOT NULL,
  form_data JSONB,
  gross_income NUMERIC(12, 2),
  tax_deductions NUMERIC(12, 2),
  tax_liability NUMERIC(12, 2),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  CONSTRAINT fk_user_forms
    FOREIGN KEY(user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create indexes for tax forms
CREATE INDEX IF NOT EXISTS idx_tax_forms_user_id ON tax_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_forms_status ON tax_forms(status);
CREATE INDEX IF NOT EXISTS idx_tax_forms_tax_year ON tax_forms(tax_year);

-- Sessions table (for future use with Redis/DB sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_sessions
    FOREIGN KEY(user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create index on token hash and expiry
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample queries (for testing)
-- SELECT * FROM users;
-- SELECT * FROM documents WHERE user_id = 1;
-- SELECT u.email, d.original_name, d.upload_date 
-- FROM users u 
-- JOIN documents d ON u.id = d.user_id;
