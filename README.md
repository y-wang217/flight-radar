# Flight Radar

Cheapest round trip from Toronto (YYZ/YTZ) to a list of destinations, departing in
the next 14 days, in three stay buckets: short (2–5 nights), medium (6–14) and long
(15–30). Tunables live in `lib/config.ts`.

## Setup

1. **Travelpayouts token**: sign up at travelpayouts.com, join the Aviasales program,
   then copy the API token from Tools → API. The affiliate marker (optional) is on the
   same page.
2. **Deploy**: push this repo to GitHub and import it in Vercel (no build settings needed).
3. **Redis**: in the Vercel project, Storage → Marketplace → *Upstash for Redis* →
   create and connect. It injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
4. **Env vars** (Project → Settings → Environment Variables):
   - `TRAVELPAYOUTS_TOKEN`
   - `TRAVELPAYOUTS_MARKER` (optional)
   - `CRON_SECRET` (any long random string, e.g. `openssl rand -hex 32`)
5. **Redeploy** so the new env vars take effect. The cron in `vercel.json` refreshes
   fares daily at 11:00 UTC.
6. **Seed** from your machine:
   ```sh
   npm install
   npx vercel link && npx vercel env pull .env.local
   npm run seed
   ```

## Local dev

`npm run dev` (uses `.env.local`, same Redis as production).
`npm run check-fare JFK` shows how many cached tickets were dropped (one-way, outside the
departure window, stay outside every bucket) vs. landed in each bucket; add `--raw` for the
full API responses.
Manual cron trigger: `curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/refresh`.

## Notes

- Prices come from Travelpayouts' cache of real searches, so quiet routes may show
  "No fare found" in some buckets. Market is `ca`, currency CAD.
- All three buckets share one set of API calls per destination (one per departure
  month × return month); the results are split by trip length.
- The add/remove endpoints are open (no auth), as is the page.
