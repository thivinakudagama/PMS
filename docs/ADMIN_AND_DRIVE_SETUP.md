# Admin and Google Drive Setup

## 1. Create the first admin in Supabase

This app already has a database trigger that automatically creates:

- a `profile`
- a new `organization`
- system roles
- an `organization_members` row with `is_admin = true`

for every brand-new auth user created directly in Supabase.

### Steps

1. Open your Supabase project.
2. Go to `Authentication` -> `Users`.
3. Click `Add user`.
4. Enter:
   - company email
   - password
   - enable email confirmation if you want the user active immediately
5. Save the user.

### Result

The database trigger `handle_new_user()` in `supabase/schema.sql` will automatically create the admin workspace for that first user.

### Important note

If you deleted all users and all projects:

- creating the first user in Supabase Auth is enough to bootstrap the first admin again
- that user can then log in to the app and create staff from the `Team` page

## 2. Apply the latest database schema

Because the app now uses:

- Google Drive-backed file metadata
- project home/subchannels
- task discussion message links
- stricter project membership rules

you must re-run the latest schema.

### Steps

1. Open `Supabase` -> `SQL Editor`.
2. Open the local file `supabase/schema.sql`.
3. Run the whole file.

## 3. Google Drive setup

The app now expects a Google **service account** with access to one shared Drive folder.

### What you need

- Google Cloud project
- Google Drive API enabled
- service account
- JSON private key
- one Google Drive folder shared with that service account

### Official references

- Drive API overview:
  https://developers.google.com/workspace/drive/api/guides/about-sdk
- Enable APIs:
  https://console.cloud.google.com/apis/library/drive.googleapis.com
- Service accounts:
  https://cloud.google.com/iam/docs/service-accounts-create
- Create service account keys:
  https://cloud.google.com/iam/docs/keys-create-delete

### Setup steps

1. Open Google Cloud Console.
2. Create a new project or use an existing one.
3. Enable the `Google Drive API`.
4. Go to `IAM & Admin` -> `Service Accounts`.
5. Create a service account.
6. Open that service account and create a `JSON` key.
7. Download the JSON key file.
8. In Google Drive, create one root folder for this app.
9. Share that folder with the service account email from the JSON file.

## 4. App environment variables

Add these values to `.env`:

```env
GOOGLE_DRIVE_CLIENT_EMAIL=service-account-name@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_google_drive_root_folder_id
```

### Where to get them

- `GOOGLE_DRIVE_CLIENT_EMAIL`
  from the JSON key file field: `client_email`

- `GOOGLE_DRIVE_PRIVATE_KEY`
  from the JSON key file field: `private_key`
  keep the line breaks escaped as `\n` inside `.env`

- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
  open the shared Google Drive folder in the browser
  the folder ID is the last part of the URL

Example:

```text
https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp
```

Folder ID:

```text
1AbCdEfGhIjKlMnOp
```

## 5. How files are stored now

For new uploads:

- file binary goes to Google Drive
- app metadata goes to `public.files`

The app stores:

- `storage_provider = google_drive`
- `drive_file_id`
- `drive_folder_id`
- `drive_web_view_link`
- `drive_download_link`

Legacy files that were already stored in Supabase Storage can still be read if their old metadata remains in the database.

## 6. Recommended first login flow

1. Create the first admin in Supabase Auth.
2. Run the latest `schema.sql`.
3. Set the Google Drive env vars.
4. Restart the app server.
5. Log in with the admin user.
6. Create staff from `Team`.
7. Create a project.
8. Add staff members to the project.
9. Use the project home channel and subchannels for collaboration.
