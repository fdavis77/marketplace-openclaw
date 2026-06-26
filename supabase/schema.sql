-- Supabase Schema for OpenClaw Marketplace
-- Run this SQL script in Supabase SQL Editor

-- Create plugins table
CREATE TABLE plugins (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  author           TEXT NOT NULL,
  description      TEXT NOT NULL,
  short_desc       TEXT,
  category         TEXT NOT NULL,
  tags             TEXT[],
  price            DECIMAL(10,2) NOT NULL DEFAULT 0,
  file_path        TEXT,
  icon             TEXT,
  badge            TEXT,
  rating           DECIMAL(3,2) DEFAULT 0,
  review_count     INT DEFAULT 0,
  install_count    INT DEFAULT 0,
  seller_email     TEXT,
  seller_stripe_id TEXT,
  status           TEXT DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE purchases (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id         UUID REFERENCES plugins(id),
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_paid       DECIMAL(10,2),
  currency          TEXT DEFAULT 'gbp',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id  UUID REFERENCES plugins(id) ON DELETE CASCADE,
  rating     INT CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plugin_id)
);

-- Create indexes
CREATE INDEX idx_plugins_slug       ON plugins(slug);
CREATE INDEX idx_plugins_category   ON plugins(category);
CREATE INDEX idx_plugins_status     ON plugins(status);
CREATE INDEX idx_purchases_user_id  ON purchases(user_id);
CREATE INDEX idx_purchases_plugin_id ON purchases(plugin_id);

-- Enable Row Level Security
ALTER TABLE plugins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews   ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Public can view published plugins"
  ON plugins FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchases"
  ON purchases FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can write reviews"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT USING (true);

-- Seed data: 12 plugins
INSERT INTO plugins
  (slug, name, author, category, description, price, icon, badge, rating, review_count, status)
VALUES
  ('hunter-gatherer','Hunter Gatherer','Apps on AI','research','Autonomous web scraper that collects competitor pricing, market trends, and social proof.',9.00,'🕷️','hot',4.9,34,'published'),
  ('brand-clone','Brand Clone','Apps on AI','video','Scrapes any Instagram or Facebook profile, extracts brand voice and generates matching video scripts.',14.00,'🎬','new',4.7,18,'published'),
  ('lead-scout','Lead Scout','Apps on AI','marketing','Finds and qualifies leads autonomously from LinkedIn, directories, and websites.',12.00,'🎯','pro',4.8,22,'published'),
  ('social-pulse','Social Pulse','Apps on AI','social','Monitors brand mentions and competitors across social platforms.',7.00,'📡',null,4.6,41,'published'),
  ('copy-engine','Copy Engine','Apps on AI','marketing','Generates ad copy, email sequences, social captions, and product descriptions.',5.00,'✍️',null,4.5,67,'published'),
  ('price-watch','Price Watch','Apps on AI','research','Tracks competitor pricing changes across e-commerce and service sites.',8.00,'📊',null,4.7,29,'published'),
  ('reel-writer','Reel Writer','CommunityDev','video','Turns any product or idea into a viral-ready Instagram Reel script.',3.00,'🎞️',null,4.3,88,'published'),
  ('invoice-bot','Invoice Bot','Apps on AI','finance','Creates, sends, and chases invoices autonomously. Integrates with Stripe.',11.00,'🧾','pro',4.9,15,'published'),
  ('review-harvester','Review Harvester','CommunityDev','research','Pulls Google, Trustpilot, and TripAdvisor reviews. Summarises sentiment.',4.00,'⭐',null,4.4,53,'published'),
  ('seo-spider','SEO Spider','Apps on AI','marketing','Crawls any website and returns a full SEO audit.',9.00,'🔍',null,4.6,37,'published'),
  ('content-calendar','Content Calendar','CommunityDev','social','Plans a 30-day content calendar across Instagram, LinkedIn, and Facebook.',0.00,'📅','free',4.2,112,'published'),
  ('product-lister','Product Lister','Apps on AI','ecommerce','Takes product photos and specs, writes optimised listings for Etsy, Amazon, eBay, and Shopify.',6.00,'🛍️','new',4.5,44,'published');
