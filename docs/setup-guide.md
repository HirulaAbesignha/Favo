# FAVO Setup Guide

## Prerequisites

- Node.js 18+
- MySQL 8+
- npm

## Install

```bash
npm install
```

## Configure the Database

Update `.env.local`:

```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/favo
JWT_SECRET=your-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

You can initialize the local database manually:

```bash
mysql -u root -p favo < database/schema.sql
```

Or use the bundled Windows helper from the project root:

```powershell
.\scripts\windows\setup-complete.bat
```

## Start the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Folders

```text
src/
  app/
  lib/
database/
docs/
scripts/
  windows/
```

## Core Features

- User registration and login
- JWT-based session handling
- Product browsing by category
- Product detail pages with stock by size

## Troubleshooting

- Verify MySQL is running before registration or login tests.
- Recheck `DATABASE_URL` if you see access denied errors.
- Restart the dev server after changing `.env.local`.
