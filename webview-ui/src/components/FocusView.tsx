import { useEffect, useState } from 'react';
import type { Task } from '../../../core/domain/types';

interface FocusViewProps {
  tasks: Task[];
  onToggleDone: (taskId: string) => void;
}

export default function FocusView({ tasks, onToggleDone }: FocusViewProps) {
  const remainingTasks = tasks.filter((task) => !task.isDone);

  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [remainingTasks.length]);

  return (
    <div className="focus-view">
      <h2>🎯 Focus</h2>

      {remainingTasks.length === 0 ? (
        <div className="completion-message">
          <p>All focused tasks are completed! 🎉</p>
          <p className="completion-message">Great job! 💪</p>
        </div>
      ) : (
        <div className="task-list" key={renderKey}>
          {remainingTasks.map((task) => (
            <div key={task.id} className="task-item fade-in">
              <input
                type="checkbox"
                checked={false}
                onChange={() => onToggleDone(task.id)}
                className="task-checkbox"
              />
              <span className="task-title">{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
