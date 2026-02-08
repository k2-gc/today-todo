import { useState, useEffect } from 'react';
import type { Task } from '../../../core/domain/types';
import { MAX_FOCUS } from '../../../core/constant/const';

interface BriefingViewProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onSetFocusedTasks: (taskIds: string[]) => void;
  onGetYesterdayIncompleteTasks: () => void;
  onCarryOverTask: (task: Task) => void;
  yesterdayTasks: Task[];
}

export default function BriefingView({
  tasks,
  onAddTask,
  onSetFocusedTasks,
  onGetYesterdayIncompleteTasks,
  onCarryOverTask,
  yesterdayTasks,
}: BriefingViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [showYesterday, setShowYesterday] = useState(false);

  useEffect(() => {
    onGetYesterdayIncompleteTasks();
  }, []);

  useEffect(() => {
    const autoSelected = tasks.slice(0, MAX_FOCUS).map((task) => task.id);
    setSelectedTaskIds(autoSelected);
  }, [tasks]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : prev.length < MAX_FOCUS
          ? [...prev, taskId]
          : prev,
    );
  };

  const handleNext = () => {
    if (selectedTaskIds.length > 0) {
      onSetFocusedTasks(selectedTaskIds);
    }
  };

  const handleCarryOver = (task: Task) => {
    onCarryOverTask(task);
  };

  return (
    <div className="briefing-view">
      <h2>📋 Today's Briefing</h2>

      {yesterdayTasks.length > 0 && (
        <div className="yesterday-section">
          <button className="yesterday-toggle" onClick={() => setShowYesterday(!showYesterday)}>
            ⚠️ {yesterdayTasks.length} task{yesterdayTasks.length > 1 ? 's' : ''} from yesterday
          </button>

          {showYesterday && (
            <div className="yesterday-tasks">
              {yesterdayTasks.map((task) => (
                <div key={task.id} className="yesterday-task-item">
                  <span className="task-title">{task.title}</span>
                  <button className="carry-over-button" onClick={() => handleCarryOver(task)}>
                    Carry Over
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="add-task-section">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && handleAddTask()}
          placeholder="Add a task for today..."
        />
        <button onClick={handleAddTask}>Add</button>
      </div>

      <div className="task-list">
        <p>Select up to {MAX_FOCUS} tasks to focus on:</p>
        <div className="task-list-divider"></div>
        {tasks.length === 0 ? (
          <p className="empty-message">No tasks yet. Add some above!</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="task-item"
              onClick={() => handleToggleTask(task.id)}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={selectedTaskIds.includes(task.id)}
                onChange={() => handleToggleTask(task.id)}
                onClick={(e) => e.stopPropagation()}
                disabled={!selectedTaskIds.includes(task.id) && selectedTaskIds.length >= MAX_FOCUS}
                className="task-checkbox"
              />
              <span className="task-title">{task.title}</span>
            </div>
          ))
        )}
      </div>

      <button className="next-button" onClick={handleNext} disabled={selectedTaskIds.length === 0}>
        Start Focus ({selectedTaskIds.length}/{MAX_FOCUS})
      </button>
    </div>
  );
}
