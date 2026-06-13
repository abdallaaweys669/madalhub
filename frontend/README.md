# Kulan Frontend

## Reliable Auth On Any Wi-Fi (Dev)

Login/signup can fail with `AxiosError: Network Error` if the app points to a local LAN IP.
Use a public tunnel URL for the API during development.

### 1) Start backend

From `backend`:

```bash
npm run start:dev
```

### 2) Start tunnel to backend

From `frontend`:

```bash
npm run tunnel:api
```

Copy the `https://...` forwarding URL from ngrok.

### 3) Set frontend API env

Create/update `.env` in `frontend`:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### 4) Restart Expo app

```bash
npm run start
```

If the ngrok URL changes, update `.env` and restart Expo.
