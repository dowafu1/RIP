import AuthForm from '../components/AuthForm';
import Logo from '../components/Logo';
import { BoltIcon, LayersIcon, ShieldIcon } from '../components/Icons';

const FEATURES = [
  {
    icon: LayersIcon,
    title: 'Только ваши задачи',
    text: 'Приватное пространство с доступом по JWT.',
  },
  {
    icon: BoltIcon,
    title: 'Синхронизация в моменте',
    text: 'WebSocket обновляет список без перезагрузки.',
  },
  {
    icon: ShieldIcon,
    title: 'Понятная архитектура',
    text: 'FastAPI, PostgreSQL и React в отдельных слоях.',
  },
];

export default function AuthPage() {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo light />

        <div className="auth-story-copy">
          <span className="eyebrow eyebrow-light">Realtime workspace</span>
          <h1>
            Меньше хаоса.
            <br />
            Больше сделанного.
          </h1>
          <p>
            Taskflow собирает ваши дела в одном спокойном пространстве и мгновенно
            синхронизирует изменения между всеми открытыми вкладками.
          </p>
        </div>

        <ul className="feature-list">
          {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
            <li key={title}>
              <span className="feature-icon">
                <FeatureIcon size={19} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </li>
          ))}
        </ul>

        <div className="auth-stack">
          <span>FastAPI</span>
          <span>React</span>
          <span>PostgreSQL</span>
          <span>WebSocket</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <Logo />
          </div>
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
