-- Run once on MySQL if `users.location` does not exist yet.
-- If the column already exists, you can ignore the error from this statement.
ALTER TABLE users
  ADD COLUMN location VARCHAR(512) NULL;
