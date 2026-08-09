-- Seed Data for Single Company PMS Database

-- Seed Profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, job_title, department)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'alex.rivera@acme.com', 'Alex Rivera', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Chief Technology Officer', 'Engineering'),
  ('00000000-0000-0000-0000-000000000002', 'marcus.vance@acme.com', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Lead Infrastructure Engineer', 'DevOps'),
  ('00000000-0000-0000-0000-000000000003', 'elena.rodriguez@acme.com', 'Elena Rodriguez', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Senior UI/UX Designer', 'Design'),
  ('00000000-0000-0000-0000-000000000004', 'sarah.chen@acme.com', 'Sarah Chen', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Product Manager', 'Product'),
  ('00000000-0000-0000-0000-000000000005', 'david.kim@acme.com', 'David Kim', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Full Stack Developer', 'Engineering')
ON CONFLICT (id) DO NOTHING;

-- Seed Single Company Organization
INSERT INTO public.organizations (id, name, slug, created_by)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Global Corp', 'acme-corp', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Seed Organization Members
INSERT INTO public.organization_members (org_id, user_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Admin'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Project Manager'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', 'Member'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000004', 'Member'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000005', 'Viewer')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Seed Projects
INSERT INTO public.projects (id, org_id, title, description, status, priority, due_date, created_by)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Cloud Infrastructure Migration', 'Migrating legacy monolith servers to Kubernetes clusters on Google Cloud Platform with automated CI/CD pipelines.', 'active', 'urgent', NOW() + INTERVAL '30 days', '00000000-0000-0000-0000-000000000001'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'NextGen Mobile Banking App', 'Redesigning the iOS and Android native experience with biometric authentication and real-time expense analytics.', 'active', 'high', NOW() + INTERVAL '45 days', '00000000-0000-0000-0000-000000000004'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'AI Customer Analytics Engine', 'Building predictive churn models and real-time dashboard visualization for enterprise account executives.', 'planning', 'medium', NOW() + INTERVAL '60 days', '00000000-0000-0000-0000-000000000001'),
  ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'SOC2 Compliance & Security Audit', 'Hardening IAM policies, implementing database encryption at rest, and executing penetration testing.', 'completed', 'high', NOW() - INTERVAL '5 days', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Seed Tasks
INSERT INTO public.tasks (id, project_id, title, description, status, priority, due_date, assigned_to, created_by)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Setup Helm charts for microservices deployment', 'Configure Helm values.yaml for staging and production k8s clusters.', 'in_progress', 'urgent', NOW() + INTERVAL '3 days', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Configure GCP Terraform State Buckets', 'Setup remote backend state storage with CMEK encryption.', 'done', 'high', NOW() - INTERVAL '2 days', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('b3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Design Biometric Authentication Flow Figma', 'Create high-fidelity screens for FaceID and TouchID fallback.', 'in_review', 'high', NOW() + INTERVAL '5 days', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'),
  ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'Implement React Native Biometrics Hook', 'Integrate react-native-biometrics library for iOS and Android.', 'todo', 'medium', NOW() + INTERVAL '10 days', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;
