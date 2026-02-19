import type { StorageAdapter } from '../storage/StorageAdapter';
import type { Task } from '../domain/types';
import { generateUUID } from '../utils/uuid';

/**
 * Carry Over Latest Incomplete Tasks to Today
 */
export async function carryOverTask(
  latestIncompleteTask: Task,
  storage: StorageAdapter,
): Promise<Task> {
  const session = await storage.getTodaySessions();
  if (!session) {
    throw new Error('No active today session found.');
  }

  // Create a new task for today based on latest incomplete task
  const newTask: Task = {
    id: generateUUID(),
    title: latestIncompleteTask.title,
    isDone: false,
    createdAt: new Date(),
    doneAt: null,
    doneSessionId: null,
  };

  await storage.saveTask(newTask);

  // Add the new task to today's session
  session.todayListTaskIds.push(newTask.id);
  await storage.saveTodaySessions(session);

  // Mark the original latest incomplete task as done (but not as "completed")
  // This is a carry-over, not a real completion, so we don't set doneSessionId
  latestIncompleteTask.isDone = true;
  latestIncompleteTask.doneAt = new Date();
  latestIncompleteTask.doneSessionId = null;
  await storage.updateArchivedTasks(latestIncompleteTask);

  return newTask;
}
