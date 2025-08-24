# 🤖 AI Screen Time Trading Platform

Advanced AI-powered trading system for Indian markets with real-time Zerodha integration, featuring separate frontend and backend architecture for optimal hosting on Vercel and Render.

## 🏗️ Architecture

- **Frontend**: Static HTML/CSS/JS (Vercel)
- **Backend**: Node.js/Express API (Render)
- **Real-time Data**: WebSocket (development) / Polling (production)
- **AI Engine**: Technical indicators and pattern recognition
- **Trading**: Zerodha API integration with paper/live trading modes

## 📁 Project Structure

```
ai-trading-platform/
├── frontend/                 # Vercel deployment
│   ├── index.html           # Main application
│   ├── styles.css           # Styling
│   ├── app.js              # Frontend logic
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   └── vercel.json         # Vercel deployment config
├── backend/                 # Render deployment
│   ├── server.js           # Express server
│   ├── zerodha-api.js      # Zerodha API integration
│   ├── ai-trading-engine.js # AI trading strategies
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Zerodha API credentials
- GitHub account
- Vercel account (free)
- Render account (free)

### 1. Local Development

#### Backend Setup
```bash
cd backend
npm install
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 2. Production Deployment

#### Backend (Render)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**
   - Create new Web Service
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables:
     ```
     ZERODHA_API_KEY=your_api_key
     ZERODHA_API_SECRET=your_api_secret
     NODE_ENV=production
     ```

3. **Update Frontend Configuration**
   - Edit `frontend/app.js`
   - Replace `your-backend-domain.onrender.com` with your actual Render domain

#### Frontend (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Deploy automatically

## 🔧 Configuration

### Environment Variables (Backend)

Create `.env` file in backend directory:

```env
# Zerodha API Configuration
ZERODHA_API_KEY=your_zerodha_api_key
ZERODHA_API_SECRET=your_zerodha_api_secret
ZERODHA_ACCESS_TOKEN=your_zerodha_access_token

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### API Configuration (Frontend)

Update `frontend/app.js`:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://your-backend-domain.onrender.com';
```

## 📊 Features

### 🔗 Zerodha Integration
- OAuth authentication
- Real-time market data
- Paper and live trading modes
- Portfolio management
- Order placement

### 🤖 AI Trading Engine
- **Momentum Strategy**: SMA, RSI, MACD analysis
- **Mean Reversion**: Bollinger Bands, RSI extremes
- **Breakout Strategy**: Price breakouts with volume
- **Screen Time Strategy**: AI-powered pattern recognition
- **Volatility Strategy**: Volatility-based trading signals

### 📈 Technical Indicators
- Simple Moving Averages (SMA)
- Relative Strength Index (RSI)
- Moving Average Convergence Divergence (MACD)
- Bollinger Bands
- Custom volatility calculations

### 💼 Portfolio Management
- Real-time positions tracking
- Account details and holdings
- P&L monitoring
- Risk management

## 🔌 API Endpoints

### Zerodha API
- `POST /api/zerodha/connect` - Connect to Zerodha
- `GET /api/zerodha/status` - Connection status
- `GET /api/zerodha/live-prices` - Live market prices
- `GET /api/zerodha/login-url` - Generate OAuth URL
- `GET /api/zerodha/auth-callback` - OAuth callback

### AI Trading
- `GET /api/ai/signals` - Generate AI trading signals
- `POST /api/ai/execute` - Execute AI trades
- `GET /api/ai/insights` - Get AI insights

### Portfolio
- `GET /api/portfolio/status` - Portfolio status
- `GET /api/portfolio/account` - Account details
- `POST /api/portfolio/order` - Place orders

### Market Data
- `GET /api/market-data` - Current market data
- `POST /api/market-data/update` - Update market data
- `GET /api/market-data/historical/:symbol` - Historical data

## 🛠️ Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Test backend
curl http://localhost:3000/health

# Test frontend
open http://localhost:5173
```

## 🔒 Security

- CORS configuration for production
- Environment variable protection
- API key encryption
- Request validation
- Error handling

## 📱 Responsive Design

- Mobile-first approach
- Progressive Web App features
- Touch-friendly interface
- Cross-browser compatibility

## 🚨 Important Notes

### Zerodha API Limits
- Rate limiting: 3 requests per second
- Market hours: 9:15 AM - 3:30 PM IST
- Paper trading available 24/7

### Production Considerations
- WebSocket disabled in production (use polling)
- Simulated data fallbacks
- Error handling and logging
- Health check endpoints

### Trading Risks
- **Paper Trading**: No real money involved
- **Live Trading**: Real money at risk
- Always test strategies thoroughly
- Use proper risk management

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: This README
- **Zerodha API**: [Zerodha API Docs](https://kite.trade/docs/)

## 🔄 Updates

### Version 2.0
- Separated frontend/backend architecture
- Vercel + Render deployment
- Enhanced AI strategies
- Improved UI/UX
- Production-ready configuration

### Future Roadmap
- Advanced AI models
- Mobile app
- Social trading features
- Multi-broker support
- Advanced analytics

---

**⚠️ Disclaimer**: This is for educational purposes. Trading involves risk. Always do your own research and consider consulting a financial advisor.
