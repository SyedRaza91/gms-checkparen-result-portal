GOVT MIDDLE SCHOOL CHECKPAREN RESULT PORTAL
Starter website files

WHAT IS INCLUDED
- index.html: responsive result portal prototype
- GMS_Checkparen_Result_Template.csv: sample upload template

RUN LOCALLY
1. Extract the ZIP.
2. Open index.html in Chrome or another modern browser.
3. Select Upload marks and import the CSV template or an Excel workbook.
4. Review records under Manage results.
5. Publish records to make them searchable in Student result.

EXCEL FORMAT
Use the first worksheet and a header row. Required columns:
Class, Roll Number, Student Name
Add subject columns such as English, Urdu, Mathematics, Science, Social Science, Kashmiri.
Class values must be exactly 1st, 2nd, 3rd, 4th, 5th, 6th, 7th or 8th.
The portal reads numeric subject values as marks.

IMPORTANT LIMITATIONS
This is a front-end prototype. Records are stored in local browser storage on the device that imports them. They do not sync between teachers, parents or devices. There is no secure admin authentication, hosted database, audit trail or server-side access control. Do not upload real student records or publish this prototype for public use until a backend such as Supabase is configured with row-level security and an administrator login.

DEPLOYMENT
The site can be deployed as a static site to Vercel by importing the project folder or its GitHub repository. For a real school-wide portal, first connect a secure database and authentication. A Vercel URL alone does not provide secure storage or admin permissions.
