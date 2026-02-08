import type { TodaySession } from '../domain/types';
import { generateUUID } from '../utils/uuid';
import { computeLogicalDate } from '../utils/logicalDate';
import type { StorageAdapter } from '../storage/StorageAdapter';

/**
 * Command to start today's session.
 * Creates a new TodaySession.
 * Change View to 'briefing' after starting.
 */

export async function startToday(storage: StorageAdapter): Promise<TodaySession> {
  const newSession: TodaySession = {
    id: generateUUID(),
    logicalDate: computeLogicalDate(new Date()),
    startedAt: new Date(),
    todayListTaskIds: [],
    focusedTaskIds: [],
    completedTaskIds: [],
  };

  await storage.saveTodaySessions(newSession);
  await storage.saveCurrentView('briefing');

  return newSession;
}
