import type { StorageAdapter } from '../storage/StorageAdapter';
import { MAX_FOCUS } from '../constant/const';

/**
 * Refill Focused Tasks from Today List when any focused task is completed.
 */
export async function autoRefillFocus(storage: StorageAdapter): Promise<void> {
  const todaySession = await storage.getTodaySessions();
  if (!todaySession) {
    return;
  }

  const tasks = await storage.getTasks();

  // Get remaining focused tasks
  const remainingFocusedTasks =
    todaySession.focusedTaskIds?.filter((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      return task && !task.isDone;
    }) || [];

  // Refill focused tasks if below MAX_FOCUS
  if (remainingFocusedTasks?.length < MAX_FOCUS) {
    const availableTasks =
      todaySession.todayListTaskIds.filter((taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        return task && !task.isDone && !todaySession.focusedTaskIds?.includes(taskId);
      }) || [];
    const needed = MAX_FOCUS - remainingFocusedTasks.length;
    const newFocusedTasks = [...remainingFocusedTasks, ...availableTasks.slice(0, needed)];

    todaySession.focusedTaskIds = newFocusedTasks;
    await storage.saveTodaySessions(todaySession);
  }
}
