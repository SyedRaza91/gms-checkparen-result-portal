# Deployment and setup

This is a production-oriented starter, not a live service until the external services below are configured and tested.

## 1. Create Supabase
1. Create a project at https://supabase.com.
2. In Project Settings → API, copy the Project URL and publishable key (`sb_publishable_...`).
3. Put those two values in `config.js`.
4. Never place a secret/service-role key in `config.js`, frontend files, GitHub or Vercel frontend variables.

## 2. Create the database
1. Open Supabase SQL Editor.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. The tables have Row Level Security enabled. Anonymous users receive no direct read/write access to student or result tables.

## 3. Create the single administrator
1. In Supabase Authentication → Users, add the Headmaster/Admin user with a school-controlled email and strong password.
2. Copy the user's UUID.
3. Run this in SQL Editor, replacing the UUID:
   `insert into public.admin_users(user_id) values ('PASTE-ADMIN-USER-UUID');`
4. Keep public sign-up disabled. Only the UUID allowlisted in `admin_users` can use the dashboard.

## 4. Protect public lookups
1. Create a Cloudflare Turnstile widget at https://dash.cloudflare.com and allow your Vercel hostname.
2. Put the Turnstile site key in `config.js`.
3. In Supabase → Edge Functions → Secrets, set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `TURNSTILE_SECRET_KEY`.
4. The service-role key must stay in Supabase Edge Function secrets only. Never commit it to GitHub or put it in browser code.

## 5. Deploy the Edge Function
Install the Supabase CLI and run from this project folder:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy public-result --no-verify-jwt
```
The function verifies Turnstile and limits each IP to 8 lookups per 10 minutes. It returns only the published marksheet fields.

## 6. Deploy to Vercel
1. Upload the contents of this folder to the root of your existing GitHub repository.
2. Commit and push. Your connected Vercel project should deploy automatically.
3. Select Framework Preset `Other`, leave Build Command blank, and set Output Directory to `.`.
4. Add your final Vercel domain to the Turnstile widget's allowed hostnames.
5. Test with dummy students before using actual school records.

## 7. Excel structure
One row represents one student for one examination. Required columns:
`exam_name, academic_year, class_name, roll_number, admission_number, student_name, father_name, subject_marks`
Optional: `remarks`.
Class must be `1st` through `8th`.
`subject_marks` must contain JSON, for example:
`{"English":{"obtained":78,"maximum":100},"Urdu":{"obtained":82,"maximum":100},"Mathematics":{"obtained":75,"maximum":100}}`
The app calculates totals, percentage, grade and result status. Imports are saved as unpublished drafts. Review and publish from the dashboard.

## 8. Privacy and operational safeguards
- Keep student marks, passwords, backups and secret keys out of GitHub.
- Public lookup reveals the student's name, father's name, class, admission/roll number, marks, grade, result and remarks to anyone who can pass the lookup checks. Obtain school approval and notify parents before publication.
- For stronger student privacy, add a student-specific access PIN or one-time code before public launch.
- Use a strong unique admin password and enable MFA in Supabase Auth where available.
- Maintain encrypted backups and periodically test restoration.
- This starter is a baseline. Conduct a security review and test all workflows before relying on it for official results.
