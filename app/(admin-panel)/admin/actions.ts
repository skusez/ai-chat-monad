"use server";

import { updateBriefStatus as updateBriefStatusDb } from "@/lib/db/queries";
import { briefStatus } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function updateBriefStatus(
  id: string,
  status: (typeof briefStatus)[number]
) {
  try {
    const result = await updateBriefStatusDb({ id, status });
    revalidatePath("/admin");
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update brief status:", error);
    return { success: false, error: "Failed to update brief status" };
  }
}
