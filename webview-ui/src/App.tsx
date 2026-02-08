import { useState, useEffect } from 'react';
import type { Task, TodaySession, ViewType } from '../../core/domain/types';
import BriefingView from './components/BriefingView';
import FocusView from './components/FocusView';
import DoneTodayView from './components/DoneTodayView';
import DoneAllView from './components/DoneAllView';
import TopNavigation from './components/TopNavigation';

// VS Code API
const vscode = acquireVsCodeApi();

export default function App() {
  const [view, setView] = useState<ViewType>('briefing');
  const [session, setSession] = useState<TodaySession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [yesterdayTasks, setYesterdayTasks] = useState<Task[]>([]);
  const [doneTodayTasks, setDoneTodayTasks] = useState<Task[]>([]);
  const [doneAllTasks, setDoneAllTasks] = useState<Task[]>([]);

  const getDoneTodayTasks = () => {
    if (!session) return [];
    return allTasks.filter((task) => task.isDone && task.doneSessionId === session.id);
  };

  const getDoneAllTasks = () => {
    if (!allTasks) return [];
    return allTasks.filter((task) => task.isDone);
  };

  useEffect(() => {
    setDoneTodayTasks(getDoneTodayTasks());
  }, [session, allTasks]);

  useEffect(() => {
    setDoneAllTasks(getDoneAllTasks());
  }, [allTasks]);

  // Handle messages from WebviewProvider
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'initialize':
          setSession(message.payload.session);
          setView(message.payload.view);
          setTasks(message.payload.tasks);
          setAllTasks(message.payload.allTasks);
          break;

        case 'addTask':
          setTasks((prev) => [...prev, message.payload.task]);
          setSession(message.payload.session);
          break;

        case 'taskUpdated':
          setTasks(message.payload.tasks);
          if (message.payload.session) {
            setSession(message.payload.session);
          }
          break;

        case 'viewChanged':
          setView(message.payload.view);
          if (message.payload.session) {
            setSession(message.payload.session);
          }
          break;

        case 'yesterdayIncompleteTasks':
          setYesterdayTasks(message.payload.tasks);
          break;

        case 'carryOverTask':
          setTasks((prev) => [...prev, message.payload.task]);
          setSession(message.payload.session);
          setYesterdayTasks((prev) =>
            prev.filter((task) => task.id !== message.payload.originalTaskId),
          );
          break;

        case 'update':
          setAllTasks(message.payload.allTasks);
          break;

        case 'error':
          console.error('Error from extension:', message.payload.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ command: 'ready' });
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send message to extension
  const sendMessage = (message: any) => {
    vscode.postMessage(message);
  };

  const handleAddTask = (title: string) => {
    sendMessage({ command: 'addTask', title });
  };

  const handleSetFocusedTasks = (taskIds: string[]) => {
    sendMessage({ command: 'setFocusedTasks', taskIds });
  };

  const handleToggleDone = (taskId: string) => {
    sendMessage({ command: 'toggleDone', taskId });
  };

  const handleSwitchView = (view: ViewType) => {
    sendMessage({ command: 'update' });
    sendMessage({ command: 'switchView', view });
  };

  const handleGetYesterdayIncompleteTasks = () => {
    sendMessage({ command: 'getYesterdayIncompleteTasks' });
  };

  const handleCarryOverTask = (task: Task) => {
    sendMessage({ command: 'carryOverTask', yesterdayTask: task });
  };

  // Get Task of Today List
  const todayTasks = session
    ? tasks.filter((task) => session.todayListTaskIds.includes(task.id) && !task.isDone)
    : [];

  // Get Focused Tasks
  const focusedTasks = session
    ? tasks.filter((task) => session.focusedTaskIds?.includes(task.id))
    : [];

  return (
    <div className="app">
      <TopNavigation currentView={view} onSwitchView={handleSwitchView} />
      {view === 'briefing' && (
        <BriefingView
          tasks={todayTasks}
          onAddTask={handleAddTask}
          onSetFocusedTasks={handleSetFocusedTasks}
          onGetYesterdayIncompleteTasks={handleGetYesterdayIncompleteTasks}
          onCarryOverTask={handleCarryOverTask}
          yesterdayTasks={yesterdayTasks}
        />
      )}
      {view === 'focus' && <FocusView tasks={focusedTasks} onToggleDone={handleToggleDone} />}
      {view === 'done_today' && <DoneTodayView tasks={doneTodayTasks} />}
      {view === 'done_all' && <DoneAllView tasks={doneAllTasks} />}
    </div>
  );
}
