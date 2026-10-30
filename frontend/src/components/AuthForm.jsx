import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

const INITIAL_FORM = {
  full_name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setForm((current) => ({
      ...current,
      password: '',
      confirmPassword: '',
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (isRegister && form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (isRegister && form.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        });
      }
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          isRegister ? 'Не удалось создать аккаунт' : 'Не удалось войти',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form-wrap">
      <div className="auth-tabs" role="tablist" aria-label="Вход или регистрация">
        <button
          aria-selected={!isRegister}
          className={!isRegister ? 'active' : ''}
          onClick={() => switchMode('login')}
          role="tab"
          type="button"
        >
          Вход
        </button>
        <button
          aria-selected={isRegister}
          className={isRegister ? 'active' : ''}
          onClick={() => switchMode('register')}
          role="tab"
          type="button"
        >
          Регистрация
        </button>
      </div>

      <div className="auth-heading">
        <h2>{isRegister ? 'Создайте аккаунт' : 'С возвращением'}</h2>
        <p>
          {isRegister
            ? 'Пара шагов — и ваш список задач будет всегда под рукой.'
            : 'Введите данные, чтобы вернуться к своим задачам.'}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegister && (
          <label className="field">
            <span>Имя</span>
            <input
              autoComplete="name"
              maxLength={120}
              name="full_name"
              onChange={handleChange}
              placeholder="Алексей Иванов"
              required
              type="text"
              value={form.full_name}
            />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            name="email"
            onChange={handleChange}
            placeholder="you@example.com"
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            name="password"
            onChange={handleChange}
            placeholder={isRegister ? 'Минимум 8 символов' : 'Ваш пароль'}
            required
            type="password"
            value={form.password}
          />
        </label>

        {isRegister && (
          <label className="field">
            <span>Повторите пароль</span>
            <input
              autoComplete="new-password"
              minLength={8}
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Ещё раз"
              required
              type="password"
              value={form.confirmPassword}
            />
          </label>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Подождите…' : isRegister ? 'Создать аккаунт' : 'Войти'}
        </button>
      </form>

      <p className="auth-legal">
        Продолжая, вы соглашаетесь с тем, что это учебный проект, а не продакшен-сервис.
      </p>
    </div>
  );
}
