import type { Task } from '../../core/domain/types';
import { generateUUID } from '../../core/utils/uuid';
import type { StorageAdapter } from '../../core/storage/StorageAdapter';

/**
 * Command to add a new task.
 * Creates a new Task and add it to Today List
 */

export async function addTask(title: string, storage: StorageAdapter): Promise<Task> {
  const newTask: Task = {
    id: generateUUID(),
    title,
    createdAt: new Date(),
    isDone: false,
    doneAt: null,
    doneSessionId: null,
  };

  await storage.saveTask(newTask);

  // Add to Today List
  const todaySession = await storage.getTodaySessions();
  if (todaySession) {
    todaySession.todayListTaskIds.push(newTask.id);
    await storage.saveTodaySessions(todaySession);
  }

  return newTask;
}
