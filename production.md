# 🌐 Production Deployment Guide (Vercel)

Your Dashflow dashboard is now built with **Next.js App Router**, which is the gold standard for deployment on Vercel.

---

### Step 1: Push to GitHub
If you haven't already, push your latest code (including the `app/` and `lib/` folders) to your repository:
```bash
git add .
git commit -m "Migrate to Next.js for Vercel deployment"
git push origin main
```

---

### Step 2: Import to Vercel
1. Go to [Vercel.com](https://vercel.com) and log in.
2. Click **"New Project"**.
3. Import your repository: `vc-dashboard-66`.

---

### Step 3: Configure Environment Variables
Before clicking "Deploy", you **must** add your environment variables in the Vercel dashboard:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini Key |
| `DATA_SOURCE` | `supabase` or `csv` | Start with `csv` or use `supabase` if ready |
| `SUPABASE_URL` | `https://...` | (If using Supabase) |
| `SUPABASE_ANON_KEY` | `eyJhbG...` | (If using Supabase) |

---

### Step 4: Deploy
Click the **"Deploy"** button. Vercel will build your app and give you a production URL (e.g., `https://vc-dashboard-66.vercel.app`).

---

### 🛡️ Secure API Routes
Next.js handles your `API Key` securely. When you visit the dashboard in production, your browser will talk to Vercel's serverless functions, which then securely use the `GEMINI_API_KEY` to get insights. **Your key is never exposed to the public.**

### 📊 CSV vs Database in Production
- **CSV**: By default, the app uses the `data/sales_data.csv` file included in your code repo.
- **Supabase**: If you want to update data without redeploying code, connect Supabase as described in the `README.md`.
