# Weight Tracker

A modern, responsive weight tracking web app with user authentication, stats, calendar, and progress graph.

## Features
- User signup/login
- Weight tracking with calendar and graph
- Profile picture picker
- Responsive, mobile-friendly design

## Local Development
1. Clone the repo
2. In `/Server`, copy `.env.example` to `.env` and fill in your MongoDB URI and JWT secret
3. Run `npm install` in `/Server`
4. Start the backend: `npm start` (from `/Server`)
5. Open `index.html` in `/Public` for the frontend (or use the static serving setup)

## Deploying to Render
- Set up a new Web Service on Render, point to `/Server` as the root
- Set environment variables: `MONGODB_URI`, `JWT_SECRET`, `PORT`
- The backend will serve the frontend from `/Public` automatically
- Use the deployed Render URL for all access

## Notes
- Do not commit your real `.env` file
- For separate frontend/backend deploys, update API URLs accordingly

---

**Enjoy tracking your progress!**