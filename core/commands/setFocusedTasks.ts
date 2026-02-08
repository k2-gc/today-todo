import type { StorageAdapter } from '../storage/StorageAdapter';
import { MAX_FOCUS } from '../constant/const';

/**
 * Command to configure focus tasks after briefing.
 * At most 3 tasks are set as Focused Tasks.
 */
export async function setFocusedTasks(taskIds: string[], storage: StorageAdapter): Promise<void> {
  if (taskIds.length > MAX_FOCUS) {
    throw new Error(`Cannot set more than ${MAX_FOCUS} focused tasks.`);
  }

  const todaySession = await storage.getTodaySessions();
  if (!todaySession) {
    throw new Error('No Today Session found');
  }

  todaySession.focusedTaskIds = taskIds;
  await storage.saveTodaySessions(todaySession);
}
