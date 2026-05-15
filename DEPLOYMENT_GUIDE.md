# Hospital IMS Deployment Guide - Vercel + Backend Service

## Part 1: Deploy Backend (Railway/Render/Heroku)

### Option A: Deploy on Railway (Recommended)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Push Your Code to GitHub** ✅ (Already done!)

3. **Deploy Backend on Railway**
   - Go to https://railway.app/dashboard
   - Click "New Project" → "Deploy from GitHub"
   - Select your `hospitle_IMS` repository
   - Select the `backend_IMS` directory
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     ```
   - Click "Deploy"
   - Railway will provide a URL like: `https://your-app.up.railway.app`

4. **Get Your Backend URL**
   - After deployment, go to Settings → Domains
   - Copy the provided Railway domain (e.g., `https://your-app.up.railway.app`)

---

## Part 2: Configure Frontend for Vercel

### Step 1: Update Frontend API Endpoint

Edit `frontend_IMS/config.ts`:

```typescript
// For production (Vercel)
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export const config = {
  apiUrl: API_BASE_URL,
  // ... rest of config
};
```

Edit `frontend_IMS/.env.production`:

```
VITE_API_URL=https://your-railway-backend-url.up.railway.app
```

### Step 2: Create `vercel.json` in Root

Create a file at `hospitle_IMS/vercel.json`:

```json
{
  "buildCommand": "cd frontend_IMS && npm install && npm run build",
  "outputDirectory": "frontend_IMS/dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

### Step 3: Update `frontend_IMS/vite.config.ts` for Production

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## Part 3: Deploy Frontend on Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```
(Sign up at https://vercel.com if you don't have an account)

### Step 3: Deploy from VS Code Terminal

```bash
cd c:\Users\acer\OneDrive\Desktop\Hospitle
vercel
```

Follow the prompts:
- **Link to existing project?** → No (first time)
- **Set project name** → hospitle-ims
- **Framework preset** → Other
- **Root directory** → ./frontend_IMS
- **Build command** → npm run build
- **Output directory** → dist

### Step 4: Set Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your `hospitle-ims` project
3. Go to Settings → Environment Variables
4. Add:
   ```
   VITE_API_URL = https://your-railway-backend-url.up.railway.app
   ```
5. Click "Save"

### Step 5: Redeploy

```bash
vercel --prod
```

---

## Part 4: Handle CORS Issues

Your backend may need CORS configuration:

Edit `backend_IMS/server.js`:

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

Add to `.env`:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## Part 5: Database Setup

For production MongoDB:

1. **Create MongoDB Atlas Account** (https://www.mongodb.com/cloud/atlas)
2. **Create a cluster** and get connection string
3. **Add to Railway/Render environment variables**:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hospitle_db
   ```

---

## Final URLs After Deployment

- **Frontend:** https://hospitle-ims.vercel.app
- **Backend API:** https://your-app.up.railway.app
- **Admin Login:** admin / password123

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Add frontend URL to backend CORS whitelist |
| API calls fail | Check VITE_API_URL env variable in Vercel |
| Build fails | Check `npm run build` works locally first |
| 503 errors | Backend service might be sleeping (upgrade plan) |

---

## Quick Commands

```bash
# Deploy backend updates
git push origin main  # Railway auto-deploys on push

# Deploy frontend updates
vercel --prod

# View logs
vercel logs
vercel env list
```
