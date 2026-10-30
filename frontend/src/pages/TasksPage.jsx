import { useCallback, useMemo, useState } from 'react';

import { LogoutIcon, XIcon, CheckIcon } from '../components/Icons';
import Logo from '../components/Logo';
import TaskComposer from '../components/TaskComposer';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { useTaskSocket } from '../hooks/useTaskSocket';

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'В работе' },
  { id: 'completed', label: 'Готово' },
];

const SOCKET_META = {
  open: { label: 'В сети', tone: 'online' },
  connecting: { label: 'Подключение…', tone: 'pending' },
  reconnecting: { label: 'Переподключение…', tone: 'pending' },
  offline: { label: 'Нет связи', tone: 'offline' },
  unauthorized: { label: 'Сессия истекла', tone: 'offline' },
};

const EMPTY_STATES = {
  all: {
    title: 'Список пока пуст',
    text: 'Добавьте первую задачу — и она мгновенно появится во всех открытых вкладках.',
  },
  active: {
    title: 'Всё сделано',
    text: 'В работе не осталось задач. Отличный момент, чтобы выдохнуть.',
  },
  completed: {
    title: 'Пока ничего не выполнено',
    text: 'Отметьте задачу галочкой, и она окажется здесь.',
  },
};

function pluralizeTasks(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'задача';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'задачи';
  return 'задач';
}

function getInitials(fullName = '') {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function TasksPage() {
  const { user, token, logout } = useAuth();
  const {
    tasks,
    isLoading,
    error,
    setError,
    reload,
    applyTaskEvent,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
  } = useTasks();
  const [filter, setFilter] = useState('all');

  const handleSocketOpen = useCallback(() => {
    reload({ background: true });
  }, [reload]);

  const socketStatus = useTaskSocket({
    token,
    onEvent: applyTaskEvent,
    onOpen: handleSocketOpen,
    onAuthError: logout,
  });

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((task) => !task.completed).length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((task) => !task.completed);
    if (filter === 'completed') return tasks.filter((task) => task.completed);
    return tasks;
  }, [filter, tasks]);

  const socketMeta = SOCKET_META[socketStatus] ?? SOCKET_META.connecting;
  const firstName = user?.full_name?.trim().split(' ')[0] || 'друг';
  const today = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const emptyState = EMPTY_STATES[filter];

  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />

        <div className="user-block">
          <span className="avatar">{getInitials(user?.full_name)}</span>
          <span className="user-details">
            <strong>{user?.full_name}</strong>
            <small>{user?.email}</small>
          </span>
          <button
            aria-label="Выйти из аккаунта"
            className="icon-button logout-button"
            onClick={logout}
            title="Выйти"
            type="button"
          >
            <LogoutIcon size={19} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="hero">
          <div className="hero-topline">
            <span className="eyebrow eyebrow-light">{today}</span>
            <span className={`socket-badge ${socketMeta.tone}`}>
              <span className="socket-dot" />
              {socketMeta.label}
            </span>
          </div>

          <div className="hero-content">
            <div>
              <h1>
                Привет, {firstName}
                <span className="hero-dot">.</span>
              </h1>
              <p>Соберите день из маленьких шагов. Мы синхронизируем каждый из них.</p>
            </div>

            <div className="hero-stats">
              <div>
                <strong>{counts.all}</strong>
                <span>всего</span>
              </div>
              <div>
                <strong>{counts.active}</strong>
                <span>в работе</span>
              </div>
              <div>
                <strong>{counts.completed}</strong>
                <span>готово</span>
              </div>
            </div>
          </div>
        </section>

        <TaskComposer onCreate={createTask} />

        {error && (
          <div className="banner banner-error" role="alert">
            <span>{error}</span>
            <button aria-label="Закрыть сообщение" onClick={() => setError(null)} type="button">
              <XIcon size={17} />
            </button>
          </div>
        )}

        <section className="workspace-panel">
          <div className="list-toolbar">
            <div aria-label="Фильтр задач" className="filters" role="tablist">
              {FILTERS.map((item) => (
                <button
                  aria-selected={filter === item.id}
                  className={filter === item.id ? 'active' : ''}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                  <span>{counts[item.id]}</span>
                </button>
              ))}
            </div>

            <span className="visible-count">
              {visibleTasks.length} {pluralizeTasks(visibleTasks.length)}
            </span>
          </div>

          {isLoading ? (
            <div aria-busy="true" aria-label="Загрузка задач" className="skeleton-list">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : visibleTasks.length > 0 ? (
            <TaskList
              onDelete={deleteTask}
              onToggle={toggleTask}
              onUpdate={updateTask}
              tasks={visibleTasks}
            />
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <CheckIcon size={26} />
              </span>
              <h2>{emptyState.title}</h2>
              <p>{emptyState.text}</p>
            </div>
          )}
        </section>

        <footer className="app-footer">
          <span>Taskflow</span>
          <span className="footer-separator" />
          <span>Изменения синхронизируются в реальном времени</span>
        </footer>
      </main>
    </div>
  );
}
