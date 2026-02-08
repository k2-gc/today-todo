import type { Task } from '../../../core/domain/types';

interface DoneTodayViewProps {
  tasks: Task[];
}

export default function DoneTodayView({ tasks }: DoneTodayViewProps) {
  return (
    <div className="done-today-view">
      <h2>✅ Done Today</h2>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="empty-message">No tasks completed today yet.</p>
        ) : (
          <>
            <p>You completed {tasks.length} task(s) today! 🎉</p>
            {tasks.map((task) => (
              <div key={task.id} className="task-row">
                <span className="task-check">✓</span>
                <span className="task-title">{task.title}</span>
                <span className="task-done-time">
                  {task.doneAt ? new Date(task.doneAt).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
