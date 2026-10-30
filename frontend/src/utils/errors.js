const NETWORK_ERROR = 'Сервер недоступен. Проверьте подключение и попробуйте ещё раз.';

export function getErrorMessage(error, fallback = 'Что-то пошло не так') {
  if (!error?.response) {
    return error?.message === 'Network Error' ? NETWORK_ERROR : fallback;
  }

  const detail = error.response.data?.detail;
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter((message) => typeof message === 'string');

    if (messages.length > 0) return messages.join('; ');
  }

  return fallback;
}
