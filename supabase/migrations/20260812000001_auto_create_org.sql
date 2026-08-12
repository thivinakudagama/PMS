-- 20260812000001_auto_create_org.sql
-- Modify the handle_new_user trigger to automatically create an organization if org_name is provided

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
  org_slug TEXT;
BEGIN
  -- 1. Create the user profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- 2. Check if they provided an org_name during signup
  org_name := NEW.raw_user_meta_data->>'org_name';
  
  IF org_name IS NOT NULL AND org_name != '' THEN
    -- Generate a URL-friendly slug from the org name (lowercase, replace spaces with hyphens, remove special chars)
    org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\s]', '', 'g'));
    org_slug := regexp_replace(org_slug, '\s+', '-', 'g');
    
    -- Append a short random string to ensure the slug is unique
    org_slug := org_slug || '-' || substr(md5(random()::text), 1, 6);

    -- Create the new organization
    INSERT INTO public.organizations (name, slug, created_by)
    VALUES (org_name, org_slug, NEW.id)
    RETURNING id INTO new_org_id;

    -- Make the creator an Admin of the new organization
    INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'Admin');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
