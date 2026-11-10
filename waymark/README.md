# Waymark tracker

Next.js app. Data is stored in Upstash Redis. Edit your goals in `lib/plan.js`.

## Deploy
1. Push this folder to GitHub.
2. On vercel.com: Add New > Project > import the repo.
3. Project > Storage > Create Database > Upstash Redis (free). Connect it to the project.
4. Project > Settings > Environment Variables: add `APP_PASSCODE` (your lock-screen password).
5. Deployments > Redeploy.

## Run locally
    npm install
    APP_PASSCODE=test npm run dev
(Without Redis keys, local data lives in memory only.)
