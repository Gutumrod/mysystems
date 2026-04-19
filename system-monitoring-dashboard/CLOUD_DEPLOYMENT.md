# Cloud Deployment

Target architecture:

- GitHub Pages hosts the dashboard.
- Google Cloud Firestore stores the latest device status and pending power commands.
- The home PC runs the local agent with `npm run agent`.

## 1. Firebase / Google Cloud

Create a Firebase project, enable Cloud Firestore, enable Google sign-in in Firebase Authentication, then create a web app.

Copy the Firebase web app config into GitHub repository variables:

- `NEXT_PUBLIC_DEVICE_ID`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Use `home-pc` for `NEXT_PUBLIC_DEVICE_ID` unless you change `DEVICE_ID` in `.env.local`.

After logging in once, copy your Firebase Auth UID from the Firebase console and replace:

```text
REPLACE_WITH_YOUR_FIREBASE_AUTH_UID
```

in `firestore.rules`, then publish the rules. This prevents public visitors from reading status or creating shutdown commands.

## 2. Service Account for Local Agent

Create a Firebase Admin service account key and save it locally as:

```text
agent/service-account.json
```

Do not commit this file. It is ignored by `.gitignore`.

## 3. Run the Local Agent

On the home PC:

```powershell
cd "C:\Users\Win10\Documents\New project\system-monitoring-dashboard"
npm run agent
```

Or double-click:

```text
start-agent.bat
```

## 4. Deploy Dashboard

Push to the `main` branch. GitHub Actions will build a static Next.js export and deploy `out/` to GitHub Pages.

In this `mysystems` repo, the dashboard is deployed under:

```text
https://gutumrod.github.io/mysystems/system-monitoring-dashboard/
```

The dashboard reads:

```text
devices/home-pc/status/current
```

Power buttons create command docs under:

```text
devices/home-pc/commands
```

The local agent executes only `hibernate` and `shutdown` commands after checking `POWER_CONTROL_PIN`.
