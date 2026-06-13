-- Task 2: enforce one registration per member per event.
-- Run this against your MySQL database selected by DB_NAME.

START TRANSACTION;

-- Remove duplicate registrations while keeping the oldest row.
DELETE er1
FROM event_registrations er1
INNER JOIN event_registrations er2
  ON er1.event_id = er2.event_id
 AND er1.member_id = er2.member_id
 AND er1.id > er2.id;

-- Add unique constraint to prevent future duplicates.
ALTER TABLE event_registrations
ADD CONSTRAINT UQ_event_registrations_member_event
UNIQUE (event_id, member_id);

COMMIT;

