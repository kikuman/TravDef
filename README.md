# Travian Defense Reporter

This is a simple full-stack Next.js application for submitting Travian attack reports. It uses Tailwind CSS for styling and Prisma with SQLite for data storage. The project is ready for deployment on Vercel.

## Development

```
npm install
npx prisma migrate dev --name init
npm run dev
```

## Deployment

The app is configured for Vercel. Make sure to run migrations and set up the database before deployment.
