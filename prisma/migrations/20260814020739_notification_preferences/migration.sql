-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyOnBroadcast" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnGuardianship" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnMessage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnSchoolInvite" BOOLEAN NOT NULL DEFAULT true;
