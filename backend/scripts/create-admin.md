# Create an admin user (role_id = 3)

Run once against your MySQL database after replacing the password hash.

Generate a bcrypt hash (from `backend/`):

```bash
node -e "require('bcrypt').hash('YourAdminPassword123', 12).then(console.log)"
```

Then insert (adjust email/name):

```sql
INSERT INTO users (full_name, email, password, phone, location, role_id, status, created_at, updated_at)
VALUES (
  'MadalHub Admin',
  'admin@madalhub.local',
  '$2b$12$REPLACE_WITH_BCRYPT_HASH',
  '',
  '',
  3,
  'active',
  NOW(),
  NOW()
);
```

Log in from the admin dashboard using **member login** (`POST /auth/login`) with that email and password. JWT role must be `3`.
