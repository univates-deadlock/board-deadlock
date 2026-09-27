-- Preserve existing users and default their profile to the least privileged role.
ALTER TABLE "user"
ADD COLUMN "role" "USER_ROLE" NOT NULL DEFAULT 'TECHNICIAN',
ALTER COLUMN "email_verified" SET DEFAULT false;

-- IDs and updated_at are managed by Prisma (uuid() and @updatedAt).
