# Krishi Bazar — MVP

A from-scratch farmer web app for Bangladesh, built with Node.js + Express and a lightweight frontend.

## Run

```bash
npm install
npm start
```

Open http://localhost:3000

## Current MVP

- Farmer-friendly landing page
- Market price cards
- Farmer login/registration flow
- Demo OTP verification (`123456`)
- Demo premium subscription
- Backend endpoints prepared for SMS, OTP, Subscription and CaaS
- Applink credentials are intentionally not exposed to the browser

## Next integration

Replace the demo endpoints with the real Applink calls after the Applink base URL, application ID and password are available. Keep those credentials only in the server environment.
