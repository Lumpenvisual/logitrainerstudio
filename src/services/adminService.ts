import { callEdge } from "@/lib/edgeClient";

export interface ApprovalUser {
  user_id: string;
  status: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  reviewed_at?: string;
}

export async function listPendingUsers() {
  return callEdge<{ data: ApprovalUser[] }>("admin-approve-user", { action: "list" });
}

export async function reviewUser(userId: string, action: "approve" | "reject") {
  return callEdge<{ success: boolean }>("admin-approve-user", { action, user_id: userId });
}
