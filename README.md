# UrbanKey — Real Estate Marketplace with Automatic Telegram Import

UrbanKey is a real estate catalog built with **React + Vite + Supabase**, featuring user accounts, an admin CRM for leads, and a Telegram bot that automatically imports new listings from a Telegram channel and publishes them on the website.

## Features

### Public Website

- Property catalog for residential properties (villas/residences) and commercial real estate
- Filters and interactive map using `react-leaflet` with route building
- Property pages (`/property/:id`, `/commercial/:id`)
- Favorites (`/favorites`)
- Search (`src/utils/search.js`)
- Multilingual support: Russian, English and Uzbek (`i18next`)
- Currency switching (`src/context/CurrencyContext.jsx`, `src/utils/currency.js`)
- Lead forms with `LeadPopup`, floating call and Telegram buttons
- Anti-spam protection
- PWA-like offline mode banner using `OfflineBanner` and `useOnlineStatus`
- SEO component (`Seo.jsx`)
- `robots.txt`
- `sitemap.xml`

### User Account

- Registration and login
- Password recovery
- `Login`, `Register`, `ForgotPassword`, `ResetPassword`
- User profile (`Profile`)
- Public user profile page (`/user/:id`)
- Add and edit personal listings (`AddProperty`, `MyListings`)
- Account deletion through a Supabase Edge Function (`supabase/functions/delete-account`)

### Admin Panel

Available to users with the `admin` role.

- Property and commercial listing management
- `AdminCards`
- `CreateVilla` / `ChangeVilla`
- `CreateCommercialPage` / `ChangeCommercialPage`
- `EditCommercialPage`
- User management (`AdminUsers`)
- Lead CRM (`AdminLeads`)
- Lead statuses:
  - `new`
  - `in_contact`
  - `deal`
  - `closed`

### Telegram Channel Parser

UrbanKey can automatically convert Telegram channel posts containing photos and captions into website listings.

The parser has two implementations using shared parsing logic from `api/listingParser.js`:

- **`server/bot.js`** — long-polling bot for a VPS or dedicated server (`npm run bot`)
- **`api/telegram-webhook.js`** — serverless webhook running directly on Vercel. This is the recommended setup because no permanently running process is required.

The parser can use **Google Gemini** to extract structured information from Telegram posts, with OpenAI as a fallback. If no AI key is configured, the system falls back to the built-in regex parser.

Telegram albums are handled separately. When several photos belong to one post, Telegram sends them as separate messages. `api/finalize-albums.js` waits for the complete album before creating the listing.

### Lead Handling

`api/lead.js` is the single server-side endpoint for all website lead forms.

The Telegram bot token is kept out of the client bundle and is never exposed through `VITE_TELEGRAM_TOKEN`.

Protection includes:

- Cloudflare Turnstile
- Honeypot field
- Basic IP-based rate limiting
- `Origin` validation

Each lead is:

1. Sent to Telegram
2. Saved to the `leads` table in Supabase
3. Displayed in the admin CRM

Optional external CRM integrations are supported through:

```text
CRM_WEBHOOK_URL
CRM_TYPE
```

Supported examples include Bitrix24 and JSON webhooks for Zapier, Make and amoCRM.

### Automatic Translation

`api/translate.js` provides a server-side translation proxy.

It avoids CSP restrictions that can prevent direct translation requests from the frontend.

The client-side translation logic is located in:

```text
src/utils/autoTranslate.js
```

---

# Tech Stack

- **React 19**
- **Vite 8**
- React Compiler
- **React Router v7**
- **React Hook Form**
- **Supabase**
  - PostgreSQL
  - Authentication
  - Storage
  - Edge Functions
- **node-telegram-bot-api**
- **Google Gemini API**
- **OpenAI API**
- **Cloudflare Turnstile**
- **Sass**
- **CSS Modules**
- **Framer Motion**
- **AOS**
- **Swiper**
- **sharp**
- **Vercel**

---

# Project Structure

```text
UrbanKey/
├── public/
│   └── static assets, images, videos, robots.txt, sitemap.xml
│
├── src/
│   ├── components/
│   │   └── UI components, navigation, property cards, forms, etc.
│   │
│   ├── pages/
│   │   └── Website pages, admin panel and user account pages
│   │
│   ├── context/
│   │   └── CurrencyContext
│   │
│   ├── hooks/
│   │   └── useOnlineStatus
│   │
│   ├── locales/
│   │   └── English / Russian / Uzbek translations
│   │
│   ├── utils/
│   │   └── Search, currency, leads and automatic translation
│   │
│   ├── api/
│   │   └── Client-side API requests
│   │
│   ├── App.jsx
│   ├── Context.jsx
│   ├── supabase.js
│   └── i18n.js
│
├── api/
│   ├── lead.js
│   ├── translate.js
│   ├── listingParser.js
│   ├── telegram-webhook.js
│   └── finalize-albums.js
│
├── server/
│   ├── bot.js
│   └── checkKeys.js
│
├── supabase/
│   ├── functions/
│   │   └── delete-account/
│   └── *.sql
│
├── sql/
│   └── Additional feature migrations
│
└── vercel.json
```

---

# Installation

Clone the repository and install dependencies:

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the Vite development server:

```text
http://localhost:5173
```

## Production Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Telegram Bot

For the long-polling VPS version:

```bash
npm run bot
```

## Supabase Key Check

```bash
npm run check-keys
```

This locally checks that the Supabase keys are configured correctly and are not mixed up.

---

# Environment Variables

## Client

These variables use the `VITE_` prefix and can be exposed to the browser.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
VITE_TURNSTILE_SITE_KEY=
```

`VITE_SUPABASE_KEY` must contain the **anon public key**, not the `service_role` key.

---

## Server / Vercel

These variables must not use the `VITE_` prefix.

```env
# Lead handling
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TURNSTILE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Optional external CRM
CRM_WEBHOOK_URL=
CRM_TYPE=
ALLOWED_ORIGINS=

# Telegram channel parser
PARSER_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
FINALIZE_SECRET=

# Optional AI
GEMINI_API_KEY=
GEMINI_MODEL=
OPENAI_API_KEY=
```

### Security

`SUPABASE_SERVICE_KEY` provides full database access and bypasses RLS.

It must only be configured on the server:

```text
Vercel Environment Variables
server/.env
```

Never expose it through frontend variables beginning with:

```text
VITE_
```

Never commit it to Git.

---

# Telegram Parser Setup

The recommended deployment uses the Vercel serverless webhook.

## 1. Configure Environment Variables

In:

```text
Vercel
→ Project Settings
→ Environment Variables
```

add:

```text
PARSER_BOT_TOKEN
SUPABASE_SERVICE_KEY
VITE_SUPABASE_URL
TELEGRAM_WEBHOOK_SECRET
```

Optional:

```text
GEMINI_API_KEY
OPENAI_API_KEY
```

## 2. Configure Supabase

Run the SQL migrations required for draft listings and webhook-based Telegram ingestion.

The exact migration files and current setup instructions are documented in the comments at the beginning of:

```text
api/telegram-webhook.js
```

## 3. Register Telegram Webhook

Register the webhook with Telegram:

```text
https://api.telegram.org/bot<PARSER_BOT_TOKEN>/setWebhook?url=https://YOUR-DOMAIN/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>&allowed_updates=["channel_post","edited_channel_post"]
```

Replace the placeholders with your real values.

## 4. Done

After the webhook is registered, Telegram automatically sends new channel posts to:

```text
/api/telegram-webhook
```

No additional process needs to be running.

---

# Long-Polling Alternative

Instead of Vercel Webhooks, the parser can run as a permanently running Node.js process.

Start it with:

```bash
npm run bot
```

This approach requires:

- VPS or dedicated server
- Node.js
- Process manager such as systemd or PM2

For most deployments, the **Vercel webhook is recommended** because it does not require a permanently running process.

---

# Telegram Post Parsing

A Telegram post can contain:

```text
Photos
+
Caption
```

The parser converts the post into a structured property listing.

AI extraction uses:

```text
Google Gemini
        ↓
OpenAI
        ↓
Regex parser
```

If AI providers are unavailable, the built-in parser is used automatically.

This means the Telegram importer can continue working without AI API keys.

---

# Album Processing

Telegram sends photos from an album as separate messages.

UrbanKey handles this through:

```text
api/finalize-albums.js
```

The system:

1. Receives individual album messages
2. Groups related photos
3. Waits for the album to finish
4. Processes the complete set
5. Creates the listing

This prevents incomplete listings with only part of the album photos.

---

# Lead Handling

All website lead forms use:

```text
api/lead.js
```

The server performs:

```text
Form
 ↓
Turnstile
 ↓
Honeypot check
 ↓
Rate limit
 ↓
Origin validation
 ↓
Telegram
 ↓
Supabase
 ↓
Admin CRM
```

The Telegram bot token is therefore never required in the frontend.

---

# CRM

Leads are stored in the Supabase:

```text
leads
```

Admin users can manage their status:

```text
new
in_contact
deal
closed
```

Optional external CRM integrations can be configured using:

```env
CRM_WEBHOOK_URL=
CRM_TYPE=
```

---

# Authentication

Users can:

- Register
- Log in
- Reset their password
- Edit their profile
- Create listings
- Edit their listings
- Delete their account

Account deletion is handled server-side through:

```text
supabase/functions/delete-account
```

---

# Multilingual Support

The application supports:

```text
English
Russian
Uzbek
```

Translations are handled with:

```text
i18next
```

Locale files are located in:

```text
src/locales/
```

---

# Currency

The displayed property price can be switched between supported currencies.

Main logic:

```text
src/context/CurrencyContext.jsx
src/utils/currency.js
```

---

# Maps and Routing

Property locations are displayed using:

```text
react-leaflet
```

Routing is also supported for the property location.

The project uses external map/routing services configured through the application.

---

# SEO

The project includes:

```text
Seo.jsx
robots.txt
sitemap.xml
```

These are used to improve search engine indexing and page metadata.

---

# Offline Mode

The application provides a PWA-like experience with an offline status banner.

Main components:

```text
OfflineBanner
useOnlineStatus
```

Users are informed when the browser loses network connectivity.

---

# Security

`vercel.json` contains security-related HTTP headers, including:

- Content Security Policy
- HSTS
- X-Frame-Options
- Permissions-Policy

The CSP is configured for services used by the application, including:

- Supabase
- Cloudflare Turnstile
- OpenStreetMap
- OSRM
- Other required external services

If a new external service is added, its domains may need to be added to:

```text
connect-src
script-src
```

inside the Content Security Policy.

---

# Deployment

UrbanKey is designed to run on Vercel with Supabase as the backend.

Recommended setup:

```text
GitHub
   ↓
Vercel
   ↓
React + Serverless API
   ↓
Supabase

Telegram
   ↓
Vercel Webhook
   ↓
Listing Parser
   ↓
Supabase
   ↓
Website
```

---

# Project Goals

UrbanKey combines several real-world development areas:

- Modern React frontend
- Responsive UI
- Authentication
- User-generated listings
- Admin CRM
- Database management
- Telegram automation
- AI-assisted data extraction
- Image processing
- SEO
- Security
- Serverless architecture
- Multilingual interface

---

# Status

UrbanKey is an actively developed real estate marketplace project.

The architecture is designed to support further expansion of:

- Property categories
- Telegram automation
- AI parsing
- CRM integrations
- Search
- User features
- Real estate analytics

---

<details>
<summary>🇷🇺 Русская версия</summary>

# UrbanKey — маркетплейс недвижимости с автоматическим импортом из Telegram

UrbanKey — сайт-каталог недвижимости на **React + Vite + Supabase**, с личными кабинетами пользователей, админ-CRM для заявок и Telegram-ботом, который автоматически импортирует новые объявления из Telegram-канала и публикует их на сайте.

## Возможности

### Публичная часть сайта

- Каталог объектов: жильё (виллы/резиденции) и коммерческая недвижимость
- Фильтры и интерактивная карта через `react-leaflet` с построением маршрутов
- Страницы объектов:
  - `/property/:id`
  - `/commercial/:id`
- Избранное (`/favorites`)
- Поиск (`src/utils/search.js`)
- Русский, английский и узбекский языки (`i18next`)
- Переключение валюты отображения цены
- Формы заявок
- `LeadPopup`
- Плавающие кнопки звонка и Telegram
- Защита от спама
- PWA-подобное поведение и баннер офлайн-режима
- `OfflineBanner`
- `useOnlineStatus`
- SEO-компонент `Seo.jsx`
- `robots.txt`
- `sitemap.xml`

### Личный кабинет

- Регистрация и вход
- Восстановление пароля
- `Login`
- `Register`
- `ForgotPassword`
- `ResetPassword`
- Профиль пользователя
- Публичная страница `/user/:id`
- Добавление и редактирование собственных объявлений
- `AddProperty`
- `MyListings`
- Удаление аккаунта через Supabase Edge Function

### Админ-панель

Доступна пользователям с ролью:

```text
admin
```

Возможности:

- Управление объектами
- Управление коммерческой недвижимостью
- Управление пользователями
- CRM заявок
- Статусы заявок:

```text
new
in_contact
deal
closed
```

### Telegram-парсер

UrbanKey автоматически превращает посты Telegram-канала с фотографиями и описанием в объявления на сайте.

Общая логика находится в:

```text
api/listingParser.js
```

Есть два варианта запуска:

```text
server/bot.js
```

Long-polling версия для VPS.

И:

```text
api/telegram-webhook.js
```

Serverless webhook для Vercel.

**Рекомендуется Vercel-вариант**, поскольку не требуется постоянно работающий процесс.

Для разбора постов используется:

```text
Google Gemini
        ↓
OpenAI
        ↓
Regex parser
```

Если AI-ключи не указаны, используется встроенный regex-парсер.

### Обработка альбомов

Telegram отправляет фотографии альбома отдельными сообщениями.

Для их объединения используется:

```text
api/finalize-albums.js
```

Система ждёт завершения альбома и только после этого создаёт объявление.

### Приём заявок

Все формы используют:

```text
api/lead.js
```

Защита:

- Cloudflare Turnstile
- Honeypot
- Rate limit по IP
- Проверка `Origin`

Заявка:

```text
Форма
 ↓
Turnstile
 ↓
Проверки
 ↓
Telegram
 ↓
Supabase
 ↓
CRM
```

Токен Telegram-бота не попадает во frontend bundle.

Заявки сохраняются в:

```text
leads
```

и отображаются в админской CRM.

Дополнительно поддерживаются внешние CRM через:

```text
CRM_WEBHOOK_URL
CRM_TYPE
```

Например:

- Bitrix24
- Zapier
- Make
- amoCRM

### Автоперевод

Серверный прокси:

```text
api/translate.js
```

Клиентская логика:

```text
src/utils/autoTranslate.js
```

Прокси используется для обхода ограничений CSP при прямом обращении к переводчику из браузера.

---

# Технологии

- React 19
- Vite 8
- React Compiler
- React Router v7
- React Hook Form
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Supabase Edge Functions
- node-telegram-bot-api
- Google Gemini API
- OpenAI API
- Cloudflare Turnstile
- Sass
- CSS Modules
- Framer Motion
- AOS
- Swiper
- sharp
- Vercel

---

# Структура проекта

```text
UrbanKey/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── hooks/
│   ├── locales/
│   ├── utils/
│   ├── api/
│   ├── App.jsx
│   ├── Context.jsx
│   ├── supabase.js
│   └── i18n.js
│
├── api/
│   ├── lead.js
│   ├── translate.js
│   ├── listingParser.js
│   ├── telegram-webhook.js
│   └── finalize-albums.js
│
├── server/
│   ├── bot.js
│   └── checkKeys.js
│
├── supabase/
│   ├── functions/
│   │   └── delete-account/
│   └── *.sql
│
├── sql/
└── vercel.json
```

---

# Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Откроется:

```text
http://localhost:5173
```

## Production build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Telegram Bot

```bash
npm run bot
```

## Проверка ключей Supabase

```bash
npm run check-keys
```

---

# Переменные окружения

### Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
VITE_TURNSTILE_SITE_KEY=
```

`VITE_SUPABASE_KEY` должен быть **anon public key**.

`service_role` использовать во frontend нельзя.

### Server / Vercel

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TURNSTILE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

CRM_WEBHOOK_URL=
CRM_TYPE=
ALLOWED_ORIGINS=

PARSER_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
FINALIZE_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=
OPENAI_API_KEY=
```

`SUPABASE_SERVICE_KEY` имеет полный доступ к базе в обход RLS.

Он должен храниться только на сервере:

```text
Vercel Environment Variables
server/.env
```

Никогда не добавляйте его в:

```text
VITE_*
```

и не коммитьте в Git.

---

# Настройка Telegram Webhook

Рекомендуемый вариант — Vercel.

Добавить в Vercel:

```text
PARSER_BOT_TOKEN
SUPABASE_SERVICE_KEY
VITE_SUPABASE_URL
TELEGRAM_WEBHOOK_SECRET
```

При необходимости:

```text
GEMINI_API_KEY
OPENAI_API_KEY
```

После этого зарегистрировать webhook:

```text
https://api.telegram.org/bot<PARSER_BOT_TOKEN>/setWebhook?url=https://YOUR-DOMAIN/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>&allowed_updates=["channel_post","edited_channel_post"]
```

После регистрации Telegram самостоятельно отправляет новые посты в:

```text
/api/telegram-webhook
```

---

# Безопасность

`vercel.json` содержит:

- CSP
- HSTS
- X-Frame-Options
- Permissions-Policy

При добавлении нового внешнего сервиса его домен может потребоваться добавить в:

```text
connect-src
script-src
```

Content Security Policy.

---

# Архитектура

```text
GitHub
   ↓
Vercel
   ↓
React + API
   ↓
Supabase

Telegram Channel
   ↓
Telegram Webhook
   ↓
Listing Parser
   ↓
Supabase
   ↓
UrbanKey Website
```

---

# Статус

UrbanKey находится в активной разработке.

Проект рассчитан на дальнейшее развитие:

- новых категорий недвижимости;
- Telegram-автоматизации;
- AI-парсинга;
- CRM-интеграций;
- поиска;
- пользовательских функций;
- аналитики недвижимости.

</details>

---

# Author

**Daniil Yemshanov**

Frontend Developer · React · JavaScript
