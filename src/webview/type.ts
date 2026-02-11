import type { Task, ViewType } from '../../core/domain/types';

export type WebviewMessage =
  | { command: 'ready' }
  | { command: 'addTask'; title: string }
  | { command: 'setFocusedTasks'; taskIds: string[] }
  | { command: 'toggleDone'; taskId: string }
  | { command: 'switchView'; view: ViewType }
  | { command: 'getLatestIncompleteTasks' }
  | { command: 'carryOverTask'; pastTask: Task }
  | { command: 'update' };
