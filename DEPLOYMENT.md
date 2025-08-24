# 🚀 Deployment Guide

Complete guide to deploy the AI Trading Platform on Vercel (Frontend) and Render (Backend).

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Render account (free)
- Zerodha API credentials

## 🔧 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: AI Trading Platform"
git branch -M main
git remote add origin https://github.com/yourusername/ai-trading-platform.git
git push -u origin main
```

### 1.2 Repository Structure
Ensure your repository has this structure:
```
ai-trading-platform/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── backend/
│   ├── server.js
│   ├── zerodha-api.js
│   ├── ai-trading-engine.js
│   ├── package.json
│   └── env.example
└── README.md
```

## 🌐 Step 2: Deploy Backend on Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Verify your email

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:

**Basic Settings:**
- **Name**: `ai-trading-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.3 Environment Variables
Add these environment variables in Render dashboard:

```env
ZERODHA_API_KEY=your_zerodha_api_key
ZERODHA_API_SECRET=your_zerodha_api_secret
NODE_ENV=production
PORT=3000
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Note your service URL: `https://your-app-name.onrender.com`

## ⚡ Step 3: Deploy Frontend on Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Verify your email

### 3.2 Import Project
1. Click "New Project"
2. Import your GitHub repository
3. Configure the project:

**Project Settings:**
- **Framework Preset**: `Other`
- **Root Directory**: `frontend`
- **Build Command**: Leave empty (static files)
- **Output Directory**: Leave empty
- **Install Command**: Leave empty

### 3.3 Update API Configuration
Before deploying, update the API URL in `frontend/app.js`:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-app-name.onrender.com'; // Your Render URL
```

### 3.4 Deploy
1. Click "Deploy"
2. Wait for deployment (1-2 minutes)
3. Note your Vercel URL: `https://your-project.vercel.app`

## 🔗 Step 4: Update CORS Configuration

### 4.1 Update Backend CORS
In `backend/server.js`, update the CORS origins:

```javascript
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://your-project.vercel.app', // Your Vercel URL
        'https://*.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### 4.2 Redeploy Backend
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete

## 🧪 Step 5: Test Your Deployment

### 5.1 Test Backend
```bash
# Health check
curl https://your-app-name.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 5.2 Test Frontend
1. Open your Vercel URL
2. Check if the page loads correctly
3. Test the "Refresh Market Data" button
4. Verify console for any errors

### 5.3 Test API Connection
1. Open browser developer tools
2. Go to Network tab
3. Click "Refresh Market Data"
4. Check if API calls are successful

## 🔧 Step 6: Configure Zerodha API

### 6.1 Get Zerodha Credentials
1. Go to [Zerodha Developers](https://developers.kite.trade/)
2. Create a new app
3. Get your API key and secret
4. Set redirect URL: `https://your-app-name.onrender.com/api/zerodha/auth-callback`

### 6.2 Update Environment Variables
In Render dashboard, update:
```env
ZERODHA_API_KEY=your_actual_api_key
ZERODHA_API_SECRET=your_actual_api_secret
```

### 6.3 Redeploy Backend
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: 
- Check CORS configuration in `backend/server.js`
- Verify Vercel URL is in allowed origins
- Redeploy backend after changes

#### 2. API Connection Failed
**Problem**: Frontend shows "Connection failed"
**Solution**:
- Check if backend is running: `curl https://your-app-name.onrender.com/health`
- Verify API_BASE_URL in `frontend/app.js`
- Check browser console for errors

#### 3. Environment Variables Not Working
**Problem**: Backend can't access environment variables
**Solution**:
- Verify variables are set in Render dashboard
- Check variable names match code
- Redeploy after adding variables

#### 4. Build Failures
**Problem**: Deployment fails during build
**Solution**:
- Check `package.json` for correct dependencies
- Verify Node.js version compatibility
- Check build logs in Render/Vercel dashboard

### Debug Commands

#### Backend Health Check
```bash
curl -X GET https://your-app-name.onrender.com/health
```

#### Test API Endpoint
```bash
curl -X GET https://your-app-name.onrender.com/api/market-data
```

#### Check CORS
```bash
curl -H "Origin: https://your-project.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS https://your-app-name.onrender.com/api/market-data
```

## 🔄 Continuous Deployment

### Automatic Deployments
Both Vercel and Render will automatically deploy when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update API configuration"
git push origin main
```

### Manual Deployments
- **Render**: Dashboard → Manual Deploy
- **Vercel**: Dashboard → Redeploy

## 📊 Monitoring

### Render Monitoring
- **Logs**: Dashboard → Logs tab
- **Metrics**: Dashboard → Metrics tab
- **Health**: Automatic health checks

### Vercel Monitoring
- **Analytics**: Dashboard → Analytics
- **Functions**: Dashboard → Functions
- **Performance**: Dashboard → Performance

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use Render's environment variable system
- Rotate API keys regularly

### CORS Configuration
- Only allow necessary origins
- Use HTTPS in production
- Validate all requests

### API Security
- Rate limiting (implemented in code)
- Request validation
- Error handling without sensitive data

## 📱 Domain Configuration (Optional)

### Custom Domain on Vercel
1. Go to Vercel dashboard
2. Project Settings → Domains
3. Add your custom domain
4. Configure DNS records

### Custom Domain on Render
1. Go to Render dashboard
2. Service Settings → Custom Domains
3. Add your custom domain
4. Configure DNS records

## 🎉 Success!

Your AI Trading Platform is now deployed and ready to use!

### Final URLs
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-app-name.onrender.com`
- **Health Check**: `https://your-app-name.onrender.com/health`

### Next Steps
1. Test all features thoroughly
2. Configure Zerodha API credentials
3. Set up monitoring and alerts
4. Share with users!

---

**Need Help?** Check the main README.md or create an issue on GitHub.
