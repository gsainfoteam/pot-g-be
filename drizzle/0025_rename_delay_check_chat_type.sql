-- Rename the enum label in place, including message templates and reservations.
-- Historical event/delivery JSON is kept intact and remains readable by the app.
ALTER TYPE "public"."popo_chat_type"
  RENAME VALUE 'popo-delay-check-request-v1' TO 'fofo-delay-check-request-v1';
