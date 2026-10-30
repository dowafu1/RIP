# Taskflow — Todo List с real-time синхронизацией

Полноценное учебное клиент-серверное приложение: личные задачи, JWT-авторизация и мгновенное обновление списка через WebSocket во всех открытых вкладках пользователя.

**Стек:** FastAPI · SQLAlchemy 2 (async) · PostgreSQL · Alembic · JWT · WebSocket · React 19 · Vite · Axios · Nginx · Docker Compose.

## Быстрый запуск

Нужны Docker Engine/Desktop с Compose v2 и свободные порты `5173` и `8000`.

```bash
cp .env.example .env
./taskflow up
```

Откройте **http://localhost:5173**, зарегистрируйтесь и создайте первую задачу. Swagger доступен на **http://localhost:8000/docs**.

`./taskflow up` собирает и запускает контейнеры **в фоне**, поэтому терминал не засыпает логами health-check’ов.

Если пропустить `cp`, проект всё равно запустится с dev-значениями по умолчанию, но `JWT_SECRET_KEY` из `.env` использовать правильнее.

Остановка:

```bash
./taskflow down      # остановить, данные сохранить
./taskflow reset     # остановить, удалить данные PostgreSQL и запустить заново
```

## Консольная команда `./taskflow`

Небольшой CLI для повседневной работы с проектом:

| Команда | Что делает |
| --- | --- |
| `./taskflow up` | Собирает образы и запускает стек в фоне, ждёт готовности |
| `./taskflow status` | Показывает состояние контейнеров |
| `./taskflow health` | Проверяет фронтенд и API |
| `./taskflow logs` | Поток логов всех сервисов; `./taskflow logs backend` — только бэкенда |
| `./taskflow shell db` | Открывает shell в контейнере (по умолчанию — `backend`) |
| `./taskflow open` | Открывает приложение в браузере |
| `./taskflow down` | Останавливает контейнеры |
| `./taskflow reset` | Удаляет volume с БД и пересоздаёт стек |

Если CLI не нужен, те же действия доступны через Docker Compose напрямую. Главное отличие: `docker compose up` **прикрепляется к логам**, а `docker compose up -d` — нет.

## Почему в консоли постоянно появляются сообщения

Это не сообщения от приложения в чат, а stdout/stderr контейнеров, которые Docker Compose показывает в текущем терминале.

- `Attaching to backend-1, db-1, frontend-1` — Compose подключился к логам трёх контейнеров. Пока терминал открыт, он печатает всё, что пишут процессы.
- Частые `GET /api/health` и `GET /` — это **Docker healthcheck**. Compose проверяет, что backend и frontend живы. Теперь healthcheck’и не засоряют access-логи: у фронтенда есть отдельный `/healthz`, а backend-фильтр скрывает `/api/health`.
- `database system is ready to accept connections`, `CREATE DATABASE`, `running bootstrap script` — одноразовая инициализация PostgreSQL при создании volume.
- `checkpoint starting/complete` в `db-1` — штатная фоновая работа PostgreSQL, а не ошибка.
- `connection open/closed` и `[accepted]` — подключения WebSocket к real-time каналу.

Если не хотите видеть поток логов, запускайте `./taskflow up` или `docker compose up -d --build`. Логи можно посмотреть позже:

```bash
./taskflow logs
./taskflow logs backend
```

`Ctrl+C` в `docker compose up` останавливает и сам стек. `Ctrl+C` в `./taskflow logs` останавливает только просмотр — контейнеры продолжают работать.

## Возможности

- Регистрация и вход по email/паролю, JWT Bearer-токен.
- Полный CRUD задач и отдельная смена статуса выполнения.
- Изоляция данных: каждый пользователь видит и изменяет только свои задачи.
- WebSocket-рассылка `created` / `updated` / `deleted` только активным клиентам этого пользователя.
- Автоматическое переподключение WebSocket с экспоненциальной задержкой и повторной загрузкой состояния.
- Валидация Pydantic, async SQLAlchemy, миграции Alembic.
- Адаптивный интерфейс на чистом CSS без UI-библиотек.

## Интерфейс

<p align="center">
  <img src="docs/screenshots/auth.png" width="49%" alt="Экран входа и регистрации">
  <img src="docs/screenshots/tasks.png" width="49%" alt="Список задач с real-time статусом">
</p>

<p align="center">
  <img src="docs/screenshots/mobile.png" width="260" alt="Мобильная версия">
</p>

## Архитектура

```text
.
├── taskflow                       # CLI: up / down / logs / health / reset
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh              # alembic upgrade head + uvicorn
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/0001_initial.py
│   ├── requirements.txt
│   └── app/
│       ├── main.py                # FastAPI, CORS, exception handlers
│       ├── api/
│       │   ├── deps.py            # AsyncSession и текущий пользователь
│       │   ├── router.py          # /api и healthcheck
│       │   ├── websocket.py       # /ws с JWT-проверкой
│       │   └── routes/
│       │       ├── auth.py
│       │       └── tasks.py
│       ├── core/
│       │   ├── access_log.py      # фильтр health-check и WS-токенов
│       │   ├── config.py          # pydantic-settings
│       │   ├── security.py        # Argon2 + PyJWT
│       │   ├── exceptions.py
│       │   └── handlers.py
│       ├── db/
│       │   ├── base.py
│       │   └── session.py         # async engine + session factory
│       ├── models/
│       │   ├── user.py
│       │   └── task.py
│       ├── schemas/
│       │   ├── auth.py
│       │   ├── user.py
│       │   └── task.py
│       ├── services/
│       │   ├── auth_service.py
│       │   └── task_service.py
│       └── realtime/
│           └── manager.py         # in-memory WebSocket manager
└── frontend/
    ├── Dockerfile                 # Vite build → Nginx
    ├── nginx.conf                 # /api и /ws proxy
    ├── vite.config.js
    └── src/
        ├── api/                   # axios client + auth/tasks API
        ├── components/            # формы, список, карточка задачи
        ├── context/AuthContext.jsx
        ├── hooks/
        │   ├── useTasks.js        # состояние и REST CRUD
        │   └── useTaskSocket.js   # WS, reconnect, события
        ├── pages/
        │   ├── AuthPage.jsx
        │   └── TasksPage.jsx
        ├── utils/                 # storage и обработка ошибок
        └── styles.css
```

Слои бэкенда не протекают друг в друга: роутеры работают с HTTP-схемами и вызывают сервисы; сервисы — единственное место, где изменяются модели и транзакции; WebSocket-менеджер не знает о БД и принимает готовые события.

## API

Базовый префикс — `/api`. Защищённые запросы требуют заголовок:

```http
Authorization: Bearer <access_token>
```

| Метод | Путь | Описание |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Регистрация, сразу возвращает JWT |
| `POST` | `/api/auth/login` | Вход, возвращает JWT |
| `GET` | `/api/auth/me` | Текущий пользователь |
| `GET` | `/api/tasks` | Задачи текущего пользователя |
| `POST` | `/api/tasks` | Создать задачу |
| `GET` | `/api/tasks/{id}` | Одна задача |
| `PATCH` | `/api/tasks/{id}` | Изменить `title`, `description`, `completed` |
| `PATCH` | `/api/tasks/{id}/toggle` | Переключить выполнение |
| `DELETE` | `/api/tasks/{id}` | Удалить задачу |
| `GET` | `/api/health` | Healthcheck |
| `WS` | `/ws?token=<JWT>` | События задач пользователя |

При доступе к чужой задаче возвращается `404`, чтобы не раскрывать её существование.

## WebSocket

Браузерный `WebSocket` не позволяет задать заголовок `Authorization`, поэтому фронтенд передаёт тот же JWT query-параметром. Бэкенд также принимает стандартный `Authorization: Bearer <JWT>` для не-браузерных клиентов. Nginx проксирует `/ws` на бэкенд, сохраняя upgrade-соединение.

Строка запроса `/ws` вырезается из access-логов backend, а Nginx не логирует `/ws`, поэтому JWT не попадает в обычные логи.

После подключения сервер присылает `connected`, затем события:

```json
{ "type": "task.created", "task": { "id": 1, "title": "Подготовить отчёт", "completed": false } }
{ "type": "task.updated", "task": { "id": 1, "title": "Подготовить отчёт", "completed": true } }
{ "type": "task.deleted", "task_id": 1 }
```

Рассылка адресная: `ConnectionManager` хранит набор сокетов по `user_id` и отправляет событие только владельцу задач, во все его вкладки. Недействительный токен закрывает соединение с кодом `1008`.

## Переменные окружения

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `POSTGRES_DB` | `todo` | Имя БД |
| `POSTGRES_USER` | `todo` | Пользователь БД |
| `POSTGRES_PASSWORD` | `todo` | Пароль БД |
| `JWT_SECRET_KEY` | dev-значение | Секрет подписи JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Время жизни токена |

Для локального запуска бэкенда вне Docker также используются `DATABASE_URL` и `CORS_ORIGINS` (шаблон — `backend/.env.example`).

## Запуск без Docker

Бэкенд:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://todo:todo@localhost:5432/todo"
alembic upgrade head
uvicorn app.main:app --reload
```

Фронтенд (Vite проксирует `/api` и `/ws` на `http://127.0.0.1:8000`):

```bash
cd frontend
npm install
npm run dev
```

## Технические ограничения учебного проекта

- `ConnectionManager` хранит подключения в памяти, поэтому Uvicorn запускается с одним worker. Для нескольких инстансов нужен общий брокер — например, Redis Pub/Sub.
- JWT хранится в `localStorage` для простоты. В production предпочтительнее httpOnly-cookie и CSRF-защита.
- JWT для WebSocket передаётся в query-параметре, но health-check и query-строка `/ws` исключены из логов. Для production всё равно предпочтительнее короткоживущий одноразовый тикет или secure-cookie.
- Нет rate limiting, подтверждения email и восстановления пароля — это осознанно оставлено за рамками учебного объёма.
