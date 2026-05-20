-- Alpha : renommer la catégorie métier leave → absence, reclasser maladie/grève.
UPDATE "GlobalLeaveType" SET category = 'absence' WHERE category = 'leave';
UPDATE "GlobalLeaveType" SET category = 'absence' WHERE id IN ('maladie', 'grève');

ALTER TABLE "GlobalLeaveType" ALTER COLUMN "category" SET DEFAULT 'absence';
