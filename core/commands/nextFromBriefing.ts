import type { StorageAdapter } from '../storage/StorageAdapter';
import { MAX_FOCUS } from '../constant/const';

/**
 * Command for completing Briefing.
 * Set top 3 tasks from Today List as Focused Tasks automatically.
 * Change View to 'focus' after setting.
 */
export async function nextFromBriefing(storage: StorageAdapter): Promise<void> {
  const todaySession = await storage.getTodaySessions();
  if (!todaySession) {
    throw new Error('No Today Session found');
  }

  // Set top 3 tasks from Today List as Focused Tasks
  const focusedTaskIds = todaySession.todayListTaskIds.slice(0, MAX_FOCUS);
  todaySession.focusedTaskIds = focusedTaskIds;

  await storage.saveTodaySessions(todaySession);
  await storage.saveCurrentView('focus');
}
