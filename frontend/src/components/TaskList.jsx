import TaskItem from './TaskItem';

export default function TaskList({ tasks, onToggle, onUpdate, onDelete }) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          onDelete={onDelete}
          onToggle={onToggle}
          onUpdate={onUpdate}
          task={task}
        />
      ))}
    </div>
  );
}
