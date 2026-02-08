/**
 * Today-Todo Domain Types
 */

export type Task = {
  id: string;
  title: string;
  createdAt: Date;
  isDone: boolean;
  doneAt?: Date | null;
  doneSessionId?: string | null;
};

export type TodaySession = {
  id: string;
  logicalDate: string; // YYYY-MM-DD (Based on 04:00 AM start of the day)
  startedAt: Date;
  todayListTaskIds: string[];
  focusedTaskIds?: string[]; // 3 items at most
  completedTaskIds: string[];
};

export type ViewType = 'briefing' | 'focus' | 'done_today' | 'done_all';
