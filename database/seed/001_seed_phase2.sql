-- Phase 2 seed data for local development

BEGIN;

INSERT INTO users (email, password_hash, role_id, first_name, last_name)
SELECT
  'staff@fira.local',
  '$2b$12$EcdCW0WyVCubfUa37hvnKuxBpTeA.QwpV.I87qexA3gC2Pm69eIqW',
  r.id,
  'Agency',
  'Staff'
FROM roles r
WHERE r.name = 'agency_staff'
ON CONFLICT (email) DO NOTHING;

INSERT INTO agency_staff_profiles (user_id, department)
SELECT u.id, 'Operations'
FROM users u
WHERE u.email = 'staff@fira.local'
AND NOT EXISTS (
  SELECT 1 FROM agency_staff_profiles p WHERE p.user_id = u.id
);

INSERT INTO companies (name, description, address, website)
VALUES
  (
    'Fil International Recruitment Agency',
    'Primary agency profile used for local development data.',
    'Manila, Philippines',
    'https://example-fira.local'
  ),
  (
    'Global Maritime Talent Corp',
    'Sample employer profile for foundational browsing.',
    'Cebu, Philippines',
    'https://example-maritime.local'
  )
ON CONFLICT DO NOTHING;

INSERT INTO jobs (company_id, title, description, location, employment_type, status, is_public)
SELECT c.id, 'Junior Web Developer', 'Support internal recruitment portal feature implementation.', 'Makati', 'full_time', 'published', TRUE
FROM companies c
WHERE c.name = 'Fil International Recruitment Agency'
AND NOT EXISTS (
  SELECT 1 FROM jobs j WHERE j.title = 'Junior Web Developer'
);

INSERT INTO jobs (company_id, title, description, location, employment_type, status, is_public)
SELECT c.id, 'Recruitment Coordinator', 'Coordinate applicant communications and intake tasks.', 'Quezon City', 'full_time', 'published', TRUE
FROM companies c
WHERE c.name = 'Fil International Recruitment Agency'
AND NOT EXISTS (
  SELECT 1 FROM jobs j WHERE j.title = 'Recruitment Coordinator'
);

INSERT INTO jobs (company_id, title, description, location, employment_type, status, is_public)
SELECT c.id, 'Operations Staff', 'Assist in employer account onboarding and support.', 'Cebu', 'contract', 'published', TRUE
FROM companies c
WHERE c.name = 'Global Maritime Talent Corp'
AND NOT EXISTS (
  SELECT 1 FROM jobs j WHERE j.title = 'Operations Staff'
);

COMMIT;
