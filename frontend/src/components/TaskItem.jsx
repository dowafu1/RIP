import { useEffect, useState } from 'react';

import { CheckIcon, PencilIcon, TrashIcon, XIcon } from './Icons';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatTaskDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

export default function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (!isEditing) {
      setTitle(task.title);
      setDescription(task.description ?? '');
    }
  }, [isEditing, task.description, task.title]);

  const isPending = pendingAction !== null;

  const handleToggle = async () => {
    setPendingAction('toggle');
    try {
      await onToggle(task.id);
    } catch {
      return;
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;

    setPendingAction('delete');
    try {
      await onDelete(task.id);
    } catch {
      return;
    } finally {
      setPendingAction(null);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    setPendingAction('save');
    try {
      await onUpdate(task.id, {
        title: normalizedTitle,
        description: description.trim() || null,
      });
      setIsEditing(false);
    } catch {
      return;
    } finally {
      setPendingAction(null);
    }
  };

  const cancelEditing = () => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setIsEditing(false);
  };

  return (
    <article className={`task-item ${task.completed ? 'is-completed' : ''}`}>
      <button
        aria-label={task.completed ? 'Отметить как незавершённую' : 'Отметить выполненной'}
        aria-pressed={task.completed}
        className="task-check"
        disabled={isPending || isEditing}
        onClick={handleToggle}
        type="button"
      >
        {task.completed && <CheckIcon size={15} />}
      </button>

      {isEditing ? (
        <form className="task-edit" onSubmit={handleSave}>
          <input
            aria-label="Название задачи"
            autoFocus
            className="task-edit-title"
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            required
            type="text"
            value={title}
          />
          <textarea
            aria-label="Описание задачи"
            className="task-edit-description"
            maxLength={2000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Описание"
            rows={2}
            value={description}
          />
          <div className="task-edit-actions">
            <button className="button button-quiet button-small" onClick={cancelEditing} type="button">
              Отмена
            </button>
            <button
              className="button button-primary button-small"
              disabled={!title.trim() || isPending}
              type="submit"
            >
              {pendingAction === 'save' ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="task-content">
            <div className="task-title-row">
              <h3>{task.title}</h3>
              {task.completed && <span className="task-status">Готово</span>}
            </div>
            {task.description && <p className="task-description">{task.description}</p>}
            <span className="task-date">Создано {formatTaskDate(task.created_at)}</span>
          </div>

          <div className="task-actions">
            <button
              aria-label="Редактировать задачу"
              className="icon-button"
              disabled={isPending}
              onClick={() => setIsEditing(true)}
              title="Редактировать"
              type="button"
            >
              <PencilIcon size={18} />
            </button>
            <button
              aria-label="Удалить задачу"
              className="icon-button icon-button-danger"
              disabled={isPending}
              onClick={handleDelete}
              title="Удалить"
              type="button"
            >
              <TrashIcon size={18} />
            </button>
          </div>
        </>
      )}
    </article>
  );
}
