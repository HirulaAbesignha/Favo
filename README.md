# FAVO

FAVO is a Next.js clothing store demo with JWT authentication, MySQL-backed products, and category browsing.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database Setup

Set a valid connection in `.env.local`:

```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/favo
JWT_SECRET=your-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

To create the database and import the bundled schema on Windows, run:

```powershell
.\scripts\windows\setup-complete.bat
```

## Project Structure

```text
src/         App routes, pages, and API handlers
database/    SQL schema
docs/        Project documentation
scripts/     Local helper scripts
public/      Static assets
```

## Notes

- The dev server uses webpack for stability on this Windows setup.
- The schema lives in `database/schema.sql`.
- Additional technical notes live under `docs/`.
