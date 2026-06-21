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

## Reactivate deactivated admins

If an admin was deactivated (status `rejected`) before the dashboard blocked self-deactivation, they disappear when the Status filter is **Active**. Use **All statuses** or **Rejected** in the Admin users table and click **Activate**.

If the list is still empty, reactivate directly in MySQL:

```sql
UPDATE users SET status = 'active', updated_at = NOW() WHERE role_id = 3;
```

Or for one account:

```sql
UPDATE users SET status = 'active', updated_at = NOW() WHERE email = 'admin@gmail.com' AND role_id = 3;
```

The account `admin@gmail.com` is the **primary admin** — the dashboard and API will not allow deactivating it. Other admins can deactivate each other; the primary admin can deactivate others too.
