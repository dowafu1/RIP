import { api } from './client';

export const tasksApi = {
  list: () => api.get('/tasks'),
  create: (payload) => api.post('/tasks', payload),
  update: (taskId, payload) => api.patch(`/tasks/${taskId}`, payload),
  toggle: (taskId) => api.patch(`/tasks/${taskId}/toggle`),
  remove: (taskId) => api.delete(`/tasks/${taskId}`),
};
