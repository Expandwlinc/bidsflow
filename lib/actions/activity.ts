import "server-only";
import { db } from "@/lib/db";

export async function logActivity(opportunityId: string, userId: string | null, action: string, metadata?: object) {
  await db.activityLog.create({
    data: { opportunityId, userId, action, metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined },
  });
}
