import { Notification, NotificationType } from "../Notification";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
}

/**
 * Internal helper, not exposed as a route — there is no admin/system-actor
 * flow in this build (see BUILD_ME.md §0), so other services (application
 * submit, password reset, etc.) call this directly to raise a notification
 * for their own user, the same way they call any other model helper.
 *
 * Deliberately NOT wrapped in withServiceErrorHandling: a notification
 * failing to write should never fail the action that triggered it (e.g. a
 * submit should still succeed even if this insert has a problem), so
 * callers fire-and-forget this and only log on failure.
 */
export const createNotification = async (
  input: CreateNotificationInput,
): Promise<void> => {
  try {
    await Notification.create({
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type ?? NotificationType.System,
      read: false,
    } as any);
  } catch (error: any) {
    console.error("Failed to create notification:", error.message);
  }
};
