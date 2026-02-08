import type { Task } from '../../core/domain/types';
import type { StorageAdapter } from '../../core/storage/StorageAdapter';

/**
 * Command to toggle a task's done status.
 */
export async function toggleDone(taskId: string, storage: StorageAdapter): Promise<Task> {
  const tasks = await storage.getTasks();
  const task = tasks.find((t) => t.id === taskId);

  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }

  const todaySession = await storage.getTodaySessions();

  if (task.isDone) {
    // Mark as not done
    task.isDone = false;
    task.doneAt = null;
    task.doneSessionId = null;
  } else {
    // Mark as done
    task.isDone = true;
    task.doneAt = new Date();
    task.doneSessionId = todaySession ? todaySession.id : null;
  }

  await storage.updateTask(task);
  return task;
}
