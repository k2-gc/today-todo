import type { StorageAdapter } from '../storage/StorageAdapter';
import type { Task } from '../domain/types';
import { generateUUID } from '../utils/uuid';

/**
 * Carry Over Past Incomplete Tasks to Today
 */
export async function carryOverTask(pastTask: Task, storage: StorageAdapter): Promise<Task> {
  const session = await storage.getTodaySessions();
  if (!session) {
    throw new Error('No active today session found.');
  }

  // Create a new task for today based on past incomplete task
  const newTask: Task = {
    id: generateUUID(),
    title: pastTask.title,
    isDone: false,
    createdAt: new Date(),
    doneAt: null,
    doneSessionId: null,
  };

  await storage.saveTask(newTask);

  // Add the new task to today's session
  session.todayListTaskIds.push(newTask.id);
  await storage.saveTodaySessions(session);

  // Mark the original past task as done
  pastTask.isDone = true;
  pastTask.doneAt = new Date();
  await storage.updateArchivedTasks(pastTask);

  return newTask;
}
