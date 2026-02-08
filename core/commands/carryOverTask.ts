import type { StorageAdapter } from '../storage/StorageAdapter';
import type { Task } from '../domain/types';
import { generateUUID } from '../utils/uuid';
import { computeLogicalDate } from '../utils/logicalDate';

/**
 * Carry Over Yesterday's Incomplete Tasks to Today
 */
export async function carryOverTask(yesterdayTask: Task, storage: StorageAdapter): Promise<Task> {
  const session = await storage.getTodaySessions();
  if (!session) {
    throw new Error('No active today session found.');
  }

  // Create a new task for today based on yesterday's incomplete task
  const newTask: Task = {
    id: generateUUID(),
    title: yesterdayTask.title,
    isDone: false,
    createdAt: new Date(),
    doneAt: null,
    doneSessionId: null,
  };

  await storage.saveTask(newTask);

  // Add the new task to today's session
  session.todayListTaskIds.push(newTask.id);
  await storage.saveTodaySessions(session);

  // Mark the original yesterday task as done
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayLogicalDate = computeLogicalDate(yesterday);
  yesterdayTask.isDone = true;
  yesterdayTask.doneAt = new Date();
  await storage.updateArchivedTasks(yesterdayLogicalDate, yesterdayTask);

  return newTask;
}
