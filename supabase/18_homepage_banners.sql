CREATE TABLE IF NOT EXISTS homepage_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position INTEGER NOT NULL UNIQUE CHECK (position IN (1, 2)),
  title TEXT NOT NULL DEFAULT '',
  button_text TEXT NOT NULL DEFAULT 'Shop now',
  button_link TEXT NOT NULL DEFAULT '/products',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the two banner slots
INSERT INTO homepage_banners (position, title, button_text, button_link)
VALUES (1, '', 'Shop now', '/products'), (2, '', 'Shop now', '/products')
ON CONFLICT (position) DO NOTHING;

-- RLS
ALTER TABLE homepage_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read homepage banners"
  ON homepage_banners FOR SELECT USING (true);

CREATE POLICY "Admins can manage homepage banners"
  ON homepage_banners FOR ALL USING (is_admin_or_staff());
