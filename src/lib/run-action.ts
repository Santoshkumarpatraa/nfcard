import type { ActionResult } from "@/app/dashboard/actions";

/** Calls a server action and turns a thrown error (network drop, server crash) into a normal failed result. */
export async function runAction(action: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await action();
  } catch {
    return { ok: false, error: "Something went wrong. Check your connection and try again." };
  }
}
