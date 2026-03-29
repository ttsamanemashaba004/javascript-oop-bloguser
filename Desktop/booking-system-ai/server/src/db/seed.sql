-- Seed data for nail salon services
-- Using realistic South African nail salon pricing

INSERT INTO services (name, duration_minutes, price, deposit_amount, is_active) VALUES
  ('Gel Overlay', 90, 350.00, 100.00, TRUE),
  ('Acrylic Full Set', 120, 450.00, 150.00, TRUE),
  ('Gel Polish (Hands)', 45, 200.00, 80.00, TRUE),
  ('Gel Polish (Feet)', 45, 200.00, 80.00, TRUE),
  ('Acrylic Fill', 60, 280.00, 100.00, TRUE),
  ('Nail Art (per nail)', 10, 30.00, 0.00, TRUE),
  ('Classic Manicure', 30, 150.00, 50.00, TRUE),
  ('Classic Pedicure', 45, 180.00, 60.00, TRUE);
