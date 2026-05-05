CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_events (
  id           VARCHAR(255) PRIMARY KEY,
  type         VARCHAR(255),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
