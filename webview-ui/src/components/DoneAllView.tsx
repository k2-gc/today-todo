import type { Task } from '../../../core/domain/types';

interface DoneAllViewProps {
  tasks: Task[];
}

export default function DoneAllView({ tasks }: DoneAllViewProps) {
  // Group by date
  const tasksByDate = tasks.reduce(
    (acc, task) => {
      if (!task.doneAt) return acc;
      const date = new Date(task.doneAt).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  return (
    <div className="done-all-view">
      <h2>📚 All Done Tasks</h2>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="empty-message">No completed tasks yet.</p>
        ) : (
          <>
            <p>Total: {tasks.length} task(s) completed</p>
            {Object.entries(tasksByDate).map(([date, dateTasks]) => (
              <div key={date} className="date-group">
                <h3>{date}</h3>
                {dateTasks.map((task) => (
                  <div key={task.id} className="task-item done">
                    <span>✓ {task.title}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
