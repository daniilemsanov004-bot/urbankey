# UrbanKey — маркетплейс недвижимости с автоматическим импортом из Telegram

Сайт-каталог недвижимости (виллы/жильё + коммерция) на React + Vite +
Supabase, с личными кабинетами пользователей, админ-CRM для заявок и
ботом, который сам подхватывает новые объявления из Telegram-канала и
публикует их на сайте.

## Возможности

### Публичная часть сайта
- Каталог объектов: жильё (виллы/резиденции) и отдельно коммерческая
  недвижимость, с фильтрами и картой (`react-leaflet` + построение
  маршрутов)
- Страницы объекта (`/property/:id`, `/commercial/:id`), избранное
  (`/favorites`), поиск (`src/utils/search.js`)
- Мультиязычность: русский, английский, узбекский (`i18next`)
- Переключение валюты отображения цены (`src/context/CurrencyContext.jsx`,
  `src/utils/currency.js`)
- Формы заявок (лендинг-попап `LeadPopup`, плавающие кнопки звонка и
  Telegram) с защитой от спама — см. «Приём заявок» ниже
- PWA-подобное поведение: баннер офлайн-режима (`OfflineBanner`,
  `useOnlineStatus`)
- SEO-компонент (`Seo.jsx`), `robots.txt`, `sitemap.xml`

### Личный кабинет пользователя
- Регистрация/вход, восстановление пароля (`Login`, `Register`,
  `ForgotPassword`, `ResetPassword`)
- Профиль (`Profile`) и публичная страница профиля пользователя
  (`/user/:id`)
- Добавление и редактирование своих объявлений (`AddProperty`,
  `MyListings`)
- Удаление аккаунта — через Supabase Edge Function
  (`supabase/functions/delete-account`)

### Админ-панель (роль `admin`)
- Управление карточками/виллами/коммерческими объектами (`AdminCards`,
  `CreateVilla` / `ChangeVilla`, `CreateCommercialPage` /
  `ChangeCommercialPage`, `EditCommercialPage`)
- Управление пользователями (`AdminUsers`)
- CRM по заявкам (`AdminLeads`) со статусами `new / in_contact / deal /
  closed`

### Бот-парсер Telegram-канала
Автоматически превращает посты в Telegram-канале (фото + подпись) в
объявления на сайте. Реализован в двух вариантах на общей логике разбора
(`api/listingParser.js`):

- **`server/bot.js`** — long-polling, для запуска на своём сервере/VPS
  (`npm run bot`);
- **`api/telegram-webhook.js`** — serverless-webhook, работает прямо на
  Vercel вместе с сайтом, без отдельного постоянно запущенного процесса
  (рекомендуемый способ). Подробная инструкция по подключению — в
  комментарии в начале самого файла.

Разбор текста поста идёт через Google Gemini (бесплатно, ключ на
aistudio.google.com), с фолбэком на OpenAI, а если ни один ключ не задан —
на встроенный regex-парсер. Отдельно обрабатываются альбомы (несколько
фото в одном посте, которые Telegram присылает отдельными сообщениями) —
`api/finalize-albums.js` дожидается всех фото альбома и только потом
создаёт объявление.

### Приём заявок (`api/lead.js`)
Единая серверная точка для всех форм на сайте — токен Telegram-бота не
попадает в клиентский бандл (как было раньше через `VITE_TELEGRAM_TOKEN`).
Защита: Cloudflare Turnstile (капча) + honeypot-поле, простейший
rate-limit по IP, проверка `Origin`. Заявка уходит в Telegram и
одновременно сохраняется в таблицу `leads` в Supabase для CRM на сайте;
опционально может пересылаться во внешнюю CRM (Bitrix24 или
JSON-вебхук для Zapier/Make/amoCRM) через `CRM_WEBHOOK_URL`/`CRM_TYPE`.

### Автоперевод объявлений
`api/translate.js` — серверный прокси для автоперевода текста объявлений
(обходит ограничения CSP на прямые запросы к переводчику с фронта),
использует `src/utils/autoTranslate.js` на клиенте.

## Технологии

- **React 19** + **Vite 8** (React Compiler включён)
- **React Router v7**, **React Hook Form**
- **Supabase** — БД, авторизация, Storage, Edge Functions (Deno)
- **node-telegram-bot-api** — бот-парсер и уведомления о заявках
- **OpenAI / Google Gemini API** — необязательный ИИ-разбор постов и
  переводы (с автоматическим фолбэком на regex, если ключи не заданы)
- **Cloudflare Turnstile** — капча в формах заявок
- **Sass / CSS Modules**, **Framer Motion**, **AOS**, **Swiper**
- **sharp** — обработка изображений

## Структура проекта

```
UrbanKey/
├── public/               # статика: изображения, видео, robots.txt, sitemap.xml
├── src/
│   ├── components/       # UI-компоненты (Nav, Hero, Villa/Commercial-карточки, формы и т.д.)
│   ├── pages/             # страницы-маршруты, включая админку и личный кабинет
│   ├── context/            # CurrencyContext
│   ├── hooks/              # useOnlineStatus
│   ├── locales/            # переводы en / ru / uz
│   ├── utils/               # search, currency, sendLead, autoTranslate
│   ├── api/                 # клиентские запросы к villas
│   ├── App.jsx / Context.jsx / supabase.js / i18n.js
├── api/                  # serverless-функции Vercel
│   ├── lead.js            # приём заявок (Turnstile, honeypot, rate-limit, CRM)
│   ├── translate.js        # серверный прокси автоперевода
│   ├── listingParser.js    # общая логика разбора Telegram-постов
│   ├── telegram-webhook.js # приём постов из канала через webhook
│   └── finalize-albums.js  # дозавершение альбомов из нескольких фото
├── server/
│   ├── bot.js              # long-polling версия бота парсера (для VPS)
│   └── checkKeys.js         # локальная проверка ключей Supabase (декодирует JWT)
├── supabase/
│   ├── functions/delete-account/  # Edge Function удаления аккаунта
│   └── *.sql                       # миграции доступа/безопасности (RLS и т.п.)
├── sql/                    # миграции для отдельных фич (альбомы/видео/буст и т.д.)
└── vercel.json             # SPA-rewrite + security-заголовки (CSP, HSTS и т.д.)
```

## Установка и запуск

```bash
npm install

npm run dev        # дев-сервер Vite, http://localhost:5173
npm run build       # продакшн-сборка
npm run preview      # предпросмотр собранной версии
npm run lint          # ESLint

npm run bot            # long-polling бот-парсер канала (для запуска на VPS)
npm run check-keys      # локальная проверка, что ключи Supabase не перепутаны местами
```

## Переменные окружения

### Клиент (Vite, префикс `VITE_`, безопасны для браузера)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=            # anon-ключ, НЕ service_role
VITE_TURNSTILE_SITE_KEY=
```

### Сервер / Vercel serverless-функции (без префикса `VITE_`, не должны попадать в бандл)

```
# Приём заявок (api/lead.js)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TURNSTILE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=          # service_role — только на сервере
CRM_WEBHOOK_URL=                # опционально
CRM_TYPE=                        # опционально, напр. "bitrix24"
ALLOWED_ORIGINS=                  # опционально, список разрешённых Origin

# Бот-парсер Telegram-канала (api/telegram-webhook.js, server/bot.js)
PARSER_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
FINALIZE_SECRET=                   # секрет для api/finalize-albums.js
GEMINI_API_KEY=                      # опционально, рекомендуется
GEMINI_MODEL=gemini-3.6-flash        # опционально
OPENAI_API_KEY=                       # опционально, запасной вариант
```

⚠️ `SUPABASE_SERVICE_KEY` даёт полный доступ к базе в обход RLS — задавайте
только на сервере (Vercel Environment Variables / `server/.env`), никогда
во фронтенд-переменных с префиксом `VITE_`.

## Настройка бота-парсера канала (Vercel-вариант, рекомендуется)

1. В Vercel → Project Settings → Environment Variables добавить
   `PARSER_BOT_TOKEN`, `SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_URL`,
   `TELEGRAM_WEBHOOK_SECRET`, и опционально `GEMINI_API_KEY` /
   `OPENAI_API_KEY`.
2. Выполнить в Supabase SQL Editor миграции, добавляющие поддержку
   черновиков/webhook-приёма постов (см. комментарий в начале
   `api/telegram-webhook.js` — там же актуальные названия файлов на
   момент последней правки парсера).
3. Один раз зарегистрировать webhook у Telegram (можно просто открыть
   ссылку в браузере, заменив плейсхолдеры на реальные значения):
   ```
   https://api.telegram.org/bot<PARSER_BOT_TOKEN>/setWebhook?url=https://ВАШ-ДОМЕН/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>&allowed_updates=["channel_post","edited_channel_post"]
   ```
4. Дальше ничего запускать вручную не нужно — Telegram сам стучится в
   `/api/telegram-webhook` при каждом новом посте в канале.

Альтернатива без Vercel — `npm run bot` (long-polling, требует постоянно
запущенного процесса, например на VPS через systemd/pm2).

## Безопасность

`vercel.json` уже включает набор security-заголовков (CSP, HSTS,
X-Frame-Options, Permissions-Policy и т.д.) под используемые внешние
домены (Supabase, Cloudflare Turnstile, OpenStreetMap/OSRM для карты).
При добавлении новых внешних доменов (например, нового провайдера
перевода) их нужно будет добавить и в `connect-src`/`script-src` в
`Content-Security-Policy`, иначе браузер заблокирует запросы.
