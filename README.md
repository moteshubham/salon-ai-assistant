# Salon AI Assistant

A simple AI receptionist system that handles customer calls, escalates unknown questions to supervisors, and learns from responses.

## What It Does

- Customer asks questions → AI checks knowledge base
- If AI knows the answer → responds directly  
- If AI doesn't know → escalates to supervisor
- Supervisor responds → AI learns for next time

## Quick Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Setup Environment

**Backend (.env):**
```env
PORT=4000
WS_PORT=4001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:4000
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Open Application

- Go to: http://localhost:5173
- Use "Call Simulator" to test the system

## How to Test

1. **Open Call Simulator tab**
2. **Enter customer name and question**
3. **Click "Start Call Simulation"**
4. **If question is unknown, go to "Help Requests" tab**
5. **Respond as supervisor**
6. **Go back to Call Simulator to see the response**
7. **Ask the same question again - AI now knows the answer!**

## Requirements

- Node.js 18+
- Firebase account with Firestore
- npm or pnpm

## Project Structure

```
salon-ai-assistant/
├── backend/          # Node.js API server
├── frontend/         # React dashboard
└── README.md
```

That's it! The system is ready to use.