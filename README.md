This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Firebase Setup (Auth + Firestore Rules)

1) Create a `.env.local` based on `.env.local.example` and fill Firebase keys.

2) Deploy Firestore rules from the root `firestore.rules` file using Firebase CLI.

3) Set Custom Claims for admin/rider:

- Create a service account key JSON in Firebase Console and save the path.
- Run the script with environment variables:
	- `FIREBASE_SERVICE_ACCOUNT_PATH` = path to service account JSON
	- `TARGET_UID` = user UID to update
	- `TARGET_ROLE` = `admin` or `rider`

Example (PowerShell):

```
$env:FIREBASE_SERVICE_ACCOUNT_PATH="C:\path\serviceAccount.json"
$env:TARGET_UID="user-uid"
$env:TARGET_ROLE="admin"
node scripts/set-custom-claims.mjs
```

After setting claims, sign out/in to refresh the token.

## Theme Mode

The theme toggle is available in the Navbar and stores a preference in `localStorage`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
