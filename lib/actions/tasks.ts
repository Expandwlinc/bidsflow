"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/actions/activity";

export async function createTask(input: {
  opportunityId: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedToId?: string;
  isRequirement?: boolean;
}) {
  const user = await requireUser();
  const task = await db.task.create({
    data: {
      opportunityId: input.opportunityId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      assignedToId: input.assignedToId || undefined,
      isRequirement: input.isRequirement ?? false,
    },
  });
  await logActivity(input.opportunityId, user.id, "TAREA_CREADA", { titulo: input.title });
  revalidatePath(`/oportunidades/${input.opportunityId}`);
  return task;
}

export async function updateTaskStatus(taskId: string, status: string) {
  const user = await requireUser();
  const task = await db.task.update({ where: { id: taskId }, data: { status: status as never } });
  await logActivity(task.opportunityId, user.id, "TAREA_ACTUALIZADA", { taskId, status });
  revalidatePath(`/oportunidades/${task.opportunityId}`);
  return task;
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const task = await db.task.delete({ where: { id: taskId } });
  await logActivity(task.opportunityId, user.id, "TAREA_ELIMINADA", { titulo: task.title });
  revalidatePath(`/oportunidades/${task.opportunityId}`);
}
