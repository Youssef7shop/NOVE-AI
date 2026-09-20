# NOVA-AI

NOVA-AI is an AI workspace powered by Supabase.

## Stack

- HTML
- CSS
- JavaScript
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Edge Functions
- Row Level Security

## No Node.js

This project does not require:

- Node.js
- npm
- Express
- SQLite

## Structure

NOVA-AI/
│
├── README.md
├── supabase/
│   ├── migrations/
│   │   └── 001_nova_schema.sql
│   └── functions/
│       └── admin-api/
│           └── index.ts
├── scripts/
│   └── setup-admin.js
└── public/
    ├── index.html
    ├── style.css
    ├── script.js
    ├── admin.html
    ├── admin.css
    └── admin.js

## Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run:

supabase/migrations/001_nova_schema.sql

4. Create a user from:

Authentication > Users

5. Change the user's profile role to admin.

Example:

UPDATE public.profiles
SET role = 'admin'
WHERE id = 'USER_UUID';

6. Configure the Supabase URL and publishable key in:

public/script.js

public/admin.js

7. Deploy the admin Edge Function.

The frontend can then be hosted as a static website.