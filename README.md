Stream4You — Stream Google Drive videos via Vercel proxy + Shaka Player (React)

What this repo contains
- frontend/  -> Vite + React app with Shaka Player. Paste a Google Drive file ID and stream via the proxy.
- api/stream.js -> Vercel Edge Function that proxies Google Drive with Range support.
- .env.example -> shows required env var for deployment

Quick overview
1. Upload a video to Google Drive and set sharing to "Anyone with the link" (Viewer).
2. Get the file ID from the share URL.
3. Deploy this repo to Vercel and set GOOGLE_API_KEY in project Environment Variables.
4. Open the frontend, paste the file ID and click Load -> Play.

--------------------
STEP-BY-STEP (Detailed)
--------------------

1) Get a Google Cloud API key
- Visit: https://console.cloud.google.com/apis/credentials
- Create a project or select one.
- Enable the **Google Drive API** (Library -> Google Drive API -> Enable).
- Create an API key (Credentials -> Create Credentials -> API key).
- Copy the API key.

2) Prepare your Google Drive file
- Upload your MP4/MKV to Google Drive.
- Right click -> Share -> Change to "Anyone with the link" -> Viewer
- Copy the share link. The file ID is the long string between /d/ and /view or after id=.
  Example: https://drive.google.com/file/d/1AbCdEfGh12345678/view  -> file id is 1AbCdEfGh12345678

3) Deploy to Vercel
- Install Vercel CLI: `npm i -g vercel`
- Login: `vercel login`
- From this project directory run: `vercel` and follow prompts OR push the repo to GitHub and import to Vercel.
- In Vercel dashboard: Project Settings -> Environment Variables -> Add `GOOGLE_API_KEY` = your API key
- Redeploy the project.

4) Use the app
- Visit the deployed frontend URL (or run locally `npm run dev` inside frontend)
- Paste the file ID and click Load. Then Play to stream via the proxy.

Notes & troubleshooting
- If you see 403 or 404 from the proxy, make sure the file is shared publicly (Anyone with link) and API key has Drive API enabled.
- Very large files may be slow; Google Drive can throttle heavy downloads. For heavy public streaming consider a CDN or Cloud storage.
- The proxy forwards Range requests so Shaka Player can seek and stream progressively.
# stream4you
