# CHGK Alphabet Trainer

Современное real-time приложение для тренировки команды ЧГК по алфавиту.

## 🚀 Быстрый старт

### 1. Клонируйте репозиторий
```bash
git clone https://github.com/your-username/chgk-alphabet-trainer.git
cd chgk-alphabet-trainer
```

### 2. Установите зависимости
```bash
npm install
```

### 3. Настройте переменные окружения
Создайте файл `.env.local` в корне проекта и добавьте:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

#### Как получить значения:
- **Google OAuth:**
  - [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - OAuth 2.0 Client ID (Web)
  - Redirect URI: `http://localhost:3000/api/auth/callback/google` и ваш production-URL
- **Яндекс OAuth:**
  - [Yandex OAuth](https://oauth.yandex.ru/client/new)
  - Redirect URI: `http://localhost:3000/api/auth/callback/yandex` и ваш production-URL
  - Включите доступы: `login:info`, `login:email`
- **Upstash Redis:**
  - [Upstash Console](https://console.upstash.com/)
  - Создайте Redis database, скопируйте REST URL и TOKEN
- **NEXTAUTH_SECRET:**
  - Сгенерируйте: `openssl rand -base64 32`

### 4. Запустите локально
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

---

## 🟢 Деплой на Vercel

1. Залейте проект на GitHub.
2. Перейдите на [vercel.com](https://vercel.com/) и создайте новый проект, выбрав ваш репозиторий.
3. В разделе **Environment Variables** добавьте все переменные из `.env.local`.
4. Деплой произойдёт автоматически.
5. В настройках OAuth добавьте production-URL в Redirect URIs.

---

## ⚙️ Особенности
- **Socket.io** работает через `/pages/api/socket.js` (совместимо с Vercel).
- **Upstash Redis** — serverless-friendly, бесплатный тариф.
- **next/image** оптимизирует аватарки (разрешены домены Google и Яндекс).
- **next-auth** поддерживает Google и Яндекс OAuth.
- **Drag-and-drop** реализован через dnd-kit.

---

## 🛠️ Технологии
- Next.js 13+ (app router + pages/api)
- Tailwind CSS, shadcn/ui
- next-auth
- socket.io, upstash/redis
- dnd-kit, zustand

---

## 📝 Лицензия
MIT

## Стек технологий
- **Next.js** (App Router, TypeScript)
- **Tailwind CSS**
- **shadcn/ui** — библиотека компонентов
- **next-auth** — аутентификация через Google и Яндекс
- **Upstash Redis** — real-time синхронизация состояния комнат
- **Socket.io** — мгновенная синхронизация между клиентами
- **Zustand + Immer** — управление состоянием на клиенте
- **dnd-kit** — drag-and-drop для очередности игроков

## Архитектура
- **Монорепозиторий** (src/app — страницы, src/lib — утилиты)
- **API-роуты** Next.js для аутентификации и real-time
- **Socket.io** для real-time событий (таймеры, ходы, уведомления)
- **Upstash Redis** для хранения состояния комнат

## Флоу пользователя
1. Пользователь заходит на сайт, может создать комнату.
2. После создания комнаты появляется ссылка для приглашения других участников.
3. При переходе по ссылке — вход через Google или Яндекс.
4. После входа — страница с алфавитом, таймерами и очередностью игроков.
5. Каждый игрок видит таймеры всех участников в реальном времени, может ставить на паузу, сбрасывать, передавать ход, менять порядок игроков drag-and-drop, удалять игроков.
6. При перезагрузке страницы состояние комнаты и ход не теряются.

## Разработка
- `npm run dev` — запуск локально
- Все ключи и секреты хранятся в `.env.local`
- Для Upstash Redis нужен бесплатный аккаунт
- Для OAuth — Google и Яндекс приложения

## TODO
- [ ] Реализация аутентификации
- [x] Реализация real-time синхронизации алфавита через socket.io
- [x] Реализация real-time таймеров и очередности игроков
- [x] Передача хода, удаление игрока, отображение таймеров всех игроков
- [x] Drag-and-drop очередности
- [x] Уведомления и real-time события (пауза, сброс, кик, вход/выход, передача хода)
- [x] Аватарки игроков
- [x] Сохранение состояния комнат в Redis (Upstash)
- [ ] Финальный UI-полиш и тесты

## Архитектурные детали
- Состояние вычеркнутых букв хранится в памяти сервера (Map), позже будет вынесено в Redis для масштабирования.
- Все события socket.io namespaced по roomId, чтобы не было утечек между комнатами.
- Для production рекомендуется вынести socket.io сервер в отдельный процесс или использовать edge-compatible WebSocket сервис.

---

Pull requests и вопросы приветствуются!
