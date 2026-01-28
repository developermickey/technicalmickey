# TechnicalMickey Course Platform

Full-stack course selling web app using **Node.js + Express**, **MongoDB + Mongoose**, **EJS**, **Tailwind (CDN)**, **JWT auth**, **PhonePe payments**, **Multer uploads**, and **PDF certificate generation**.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `env.example` (copy & fill values):

```bash
cp env.example .env
```

3. Run MongoDB locally (or point `MONGO_URI` to your cluster).

## Seed Demo Data

Creates:
- **Admin user**
- **Student user** (auto-enrolled into the demo course)
- **Published demo course** with topics, lectures and a quiz

```bash
npm run seed
```

Seed defaults (override via env):
- `SEED_ADMIN_EMAIL=admin@example.com`
- `SEED_ADMIN_PASSWORD=Admin@12345`
- `SEED_STUDENT_EMAIL=student@example.com`
- `SEED_STUDENT_PASSWORD=Student@12345`

## Run

Dev:

```bash
npm run dev
```

Prod:

```bash
npm start
```

Then open: `http://localhost:5000`

## Key Routes

- Public:
  - `/` home
  - `/courses` listing (search/filter/pagination)
  - `/courses/:id` detail
- Auth:
  - `/auth/register`, `/auth/login`, `/auth/logout`
- Student:
  - `/user/dashboard`, `/user/profile`
  - `/cart`, `/my-courses`
  - `/learn/:courseId` (video + progress)
  - `/learn/:courseId/quiz`
  - `/learn/:courseId/certificate` (PDF download after 100% progress)
- Admin (role=admin):
  - `/admin` dashboard
  - `/admin/courses` create/list
  - `/admin/courses/:courseId` edit + topics/lectures/quiz
  - `/admin/users`
  - `/admin/purchases`
- Payments (PhonePe):
  - `/orders/checkout/:courseId` (GET shows checkout, POST initiates PhonePe pay page)
  - `/orders/callback` PhonePe callback
  - `/orders/success/:txn` success page

## PhonePe Notes

PhonePe signing helpers are in `config/phonepe.js`. Ensure:
- `PHONEPE_MERCHANT_ID`
- `PHONEPE_SALT_KEY`
- `PHONEPE_SALT_INDEX`
- `PHONEPE_BASE_URL` (prod default is set)
- `BASE_URL` is your publicly reachable base (for callback/redirect URLs)

