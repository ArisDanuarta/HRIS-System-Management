-- AlterEnum
ALTER TYPE "hris"."BroadcastDeliveryStatus" ADD VALUE 'SENDING';

-- AlterEnum
ALTER TYPE "hris"."BroadcastStatus" ADD VALUE 'QUEUED';
ALTER TYPE "hris"."BroadcastStatus" ADD VALUE 'SCHEDULED';
ALTER TYPE "hris"."BroadcastStatus" ADD VALUE 'CANCELED';
