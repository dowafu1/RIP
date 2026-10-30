import { useRef, useState } from 'react';

import { PlusIcon } from './Icons';

export default function TaskComposer({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef(null);

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
      });
      setTitle('');
      setDescription('');
      titleInputRef.current?.focus();
    } catch {
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-title-row">
        <span className="composer-icon">
          <PlusIcon size={21} />
        </span>
        <input
          aria-label="Название новой задачи"
          className="composer-title"
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Что нужно сделать?"
          ref={titleInputRef}
          type="text"
          value={title}
        />
      </div>

      <textarea
        aria-label="Описание новой задачи"
        className="composer-description"
        maxLength={2000}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Добавьте детали — дедлайн, контекст, ссылку…"
        rows={2}
        value={description}
      />

      <div className="composer-footer">
        <span className="composer-hint">Задача сразу появится на всех ваших устройствах</span>
        <button className="button button-primary" disabled={!canSubmit} type="submit">
          <PlusIcon size={18} />
          {isSubmitting ? 'Добавляем…' : 'Добавить задачу'}
        </button>
      </div>
    </form>
  );
}
