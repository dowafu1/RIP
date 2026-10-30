import { useCallback, useEffect, useState } from 'react';

import { tasksApi } from '../api/tasks';
import { getErrorMessage } from '../utils/errors';

function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const dateDelta = new Date(right.created_at) - new Date(left.created_at);
    return dateDelta || right.id - left.id;
  });
}

function upsertTask(tasks, task) {
  const exists = tasks.some((item) => item.id === task.id);
  const nextTasks = exists
    ? tasks.map((item) => (item.id === task.id ? task : item))
    : [task, ...tasks];
  return sortTasks(nextTasks);
}

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async ({ background = false } = {}) => {
    if (!background) setIsLoading(true);
    setError(null);
    try {
      const { data } = await tasksApi.list();
      setTasks(sortTasks(data));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось загрузить задачи'));
    } finally {
      if (!background) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const applyTaskEvent = useCallback((event) => {
    if (event.type === 'task.created' || event.type === 'task.updated') {
      if (event.task) {
        setTasks((currentTasks) => upsertTask(currentTasks, event.task));
      }
      return;
    }

    if (event.type === 'task.deleted') {
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== event.task_id));
    }
  }, []);

  const createTask = useCallback(async (payload) => {
    setError(null);
    try {
      const { data } = await tasksApi.create(payload);
      setTasks((currentTasks) => upsertTask(currentTasks, data));
      return data;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось создать задачу'));
      throw requestError;
    }
  }, []);

  const updateTask = useCallback(async (taskId, payload) => {
    setError(null);
    try {
      const { data } = await tasksApi.update(taskId, payload);
      setTasks((currentTasks) => upsertTask(currentTasks, data));
      return data;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось сохранить задачу'));
      throw requestError;
    }
  }, []);

  const toggleTask = useCallback(async (taskId) => {
    setError(null);
    try {
      const { data } = await tasksApi.toggle(taskId);
      setTasks((currentTasks) => upsertTask(currentTasks, data));
      return data;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось изменить статус задачи'));
      throw requestError;
    }
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    setError(null);
    try {
      await tasksApi.remove(taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Не удалось удалить задачу'));
      throw requestError;
    }
  }, []);

  return {
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
  };
}
