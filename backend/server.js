const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const ZerodhaAPI = require('./zerodha-api');
const AITradingEngine = require('./ai-trading-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for frontend
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://your-frontend-domain.vercel.app', // Replace with your Vercel domain
        'https://*.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Zerodha API and AI Trading Engine
const zerodhaAPI = new ZerodhaAPI();
const aiEngine = new AITradingEngine();

// Global variables
let zerodhaConnected = false;
let tradingMode = 'paper';
let marketData = {};
let realTimeData = {
    'NIFTY': { price: 19847.25, change: 125.50, changePercent: 0.64 },
    'BANKNIFTY': { price: 44568.75, change: 368.25, changePercent: 0.83 },
    'SENSEX': { price: 66123.45, change: 456.78, changePercent: 0.70 },
    'FINNIFTY': { price: 20234.50, change: -45.25, changePercent: -0.22 }
};

// WebSocket Server Setup (only for local development)
let wss = null;
if (process.env.NODE_ENV !== 'production') {
    try {
        wss = new WebSocket.Server({ port: 8083 });
        console.log('🔌 WebSocket server started on port 8083 (development only)');
    } catch (error) {
        console.log('⚠️ WebSocket server failed to start on port 8083');
    }
}

// WebSocket connection handling
if (wss) {
    wss.on('connection', (ws) => {
        console.log('🔌 WebSocket client connected');
        
        // Send initial market data
        ws.send(JSON.stringify({
            type: 'market_data',
            data: realTimeData,
            timestamp: new Date().toISOString()
        }));

        ws.on('close', () => {
            console.log('🔌 WebSocket client disconnected');
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
}

// Broadcast real-time data to all connected clients
function broadcastMarketData() {
    if (wss) {
        // Generate live market data
        const liveData = {};
        Object.keys(realTimeData).forEach(symbol => {
            const basePrice = realTimeData[symbol].price || 1000;
            const change = (Math.random() - 0.5) * 20;
            const newPrice = basePrice + change;
            const changePercent = (change / basePrice) * 100;
            
            liveData[symbol] = {
                price: newPrice,
                change: change,
                changePercent: changePercent,
                timestamp: new Date().toISOString()
            };
        });

        // Update real-time data
        realTimeData = { ...realTimeData, ...liveData };

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'market_data',
                    data: realTimeData,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    }
}

// Update real-time data every 2 seconds (development only)
if (process.env.NODE_ENV !== 'production') {
    setInterval(broadcastMarketData, 2000);
}

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes

// Connect to Zerodha
app.post('/api/zerodha/connect', async (req, res) => {
    const { apiKey, apiSecret, accessToken, mode } = req.body;
    
    try {
        // Configure API credentials
        zerodhaAPI.apiKey = apiKey || zerodhaAPI.apiKey;
        zerodhaAPI.apiSecret = apiSecret || zerodhaAPI.apiSecret;
        zerodhaAPI.accessToken = accessToken || null;
        tradingMode = mode || 'paper';
        
        // Use simple authentication for immediate access
        const authResult = await zerodhaAPI.simpleAuth();
        if (authResult.success) {
            zerodhaAPI.accessToken = authResult.accessToken;
            tradingMode = 'paper'; // Force paper trading mode for now
        }
        
        // Test connection by fetching instruments
        const instrumentsResult = await zerodhaAPI.getInstruments();
        
        if (instrumentsResult.success) {
            zerodhaConnected = true;
            console.log(`✅ Zerodha connected successfully in ${tradingMode.toUpperCase()} mode`);
            console.log(`📊 Loaded ${instrumentsResult.instruments.length} instruments`);
            
            res.json({
                success: true,
                message: `Zerodha connected successfully in ${tradingMode.toUpperCase()} mode`,
                accessToken: zerodhaAPI.accessToken,
                instruments: instrumentsResult.instruments,
                connected: true,
                mode: tradingMode,
                instrumentsCount: instrumentsResult.instruments.length
            });
        } else {
            throw new Error('Failed to fetch instruments');
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get Zerodha connection status
app.get('/api/zerodha/status', (req, res) => {
    res.json({
        connected: zerodhaConnected,
        mode: tradingMode,
        apiKey: zerodhaAPI.apiKey !== 'your_zerodha_api_key' ? 'Configured' : 'Not Configured',
        accessToken: zerodhaAPI.accessToken ? 'Valid' : 'Invalid',
        instrumentsLoaded: zerodhaAPI.instruments.size || 10
    });
});

// Get live market prices
app.get('/api/zerodha/live-prices', async (req, res) => {
    try {
        if (!zerodhaConnected) {
            return res.status(400).json({
                success: false,
                message: 'Zerodha not connected. Please connect first.'
            });
        }

        const instruments = zerodhaAPI.watchlist;
        const quotesResult = await zerodhaAPI.getQuotes(instruments);
        
        if (quotesResult.success) {
            res.json({
                success: true,
                mode: tradingMode,
                prices: quotesResult.quotes,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Failed to fetch quotes');
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate login URL for OAuth
app.get('/api/zerodha/login-url', (req, res) => {
    const { redirect_uri, apiKey, apiSecret } = req.query;
    
    if (apiKey && apiSecret) {
        zerodhaAPI.apiKey = apiKey;
        zerodhaAPI.apiSecret = apiSecret;
    }
    
    const loginURL = zerodhaAPI.generateLoginURL(redirect_uri);
    
    res.json({
        success: true,
        loginURL: loginURL,
        redirect_uri: redirect_uri || 'http://localhost:3000/auth-callback'
    });
});

// Handle OAuth callback
app.get('/api/zerodha/auth-callback', async (req, res) => {
    const { request_token, action, status } = req.query;
    
    if (status === 'success' && request_token) {
        try {
            const authResult = await zerodhaAPI.authenticate(request_token);
            
            if (authResult.success) {
                zerodhaConnected = true;
                tradingMode = 'live';
                
                res.json({
                    success: true,
                    message: 'Authentication successful',
                    accessToken: authResult.accessToken,
                    mode: 'live'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Authentication failed',
                    error: authResult.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    } else {
        // Use simple authentication for immediate access
        const authResult = await zerodhaAPI.simpleAuth();
        if (authResult.success) {
            zerodhaConnected = true;
            tradingMode = 'paper'; // Force paper trading mode
            res.json({
                success: true,
                message: 'Simple authentication successful (paper trading mode)',
                accessToken: authResult.accessToken,
                mode: 'paper'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Authentication failed',
                error: authResult.error
            });
        }
    }
});

// AI Trading Routes

// Get AI trading signals
app.get('/api/ai/signals', async (req, res) => {
    try {
        if (!zerodhaConnected) {
            return res.status(400).json({
                success: false,
                message: 'Zerodha not connected. Please connect first.'
            });
        }

        // Generate market data for AI analysis
        const marketDataForAI = {};
        for (const instrument of zerodhaAPI.watchlist) {
            const quotes = await zerodhaAPI.getQuotes([instrument]);
            if (quotes.success && quotes.quotes[instrument.symbol]) {
                const quote = quotes.quotes[instrument.symbol];
                
                // Generate historical price data for technical analysis
                const prices = [];
                const basePrice = quote.last_price;
                for (let i = 50; i >= 0; i--) {
                    const change = (Math.random() - 0.5) * 100;
                    prices.push({
                        close: basePrice + change,
                        high: basePrice + change + Math.random() * 10,
                        low: basePrice + change - Math.random() * 10,
                        volume: Math.floor(Math.random() * 10000) + 1000
                    });
                }
                
                marketDataForAI[instrument.symbol] = {
                    prices: prices,
                    currentPrice: quote.last_price,
                    change: quote.change,
                    changePercent: quote.change_percent
                };
            }
        }

        // Generate AI signals
        const signals = aiEngine.generateSignals(marketDataForAI);
        const insights = aiEngine.getAIInsights();

        res.json({
            success: true,
            signals: signals,
            insights: insights,
            marketData: marketDataForAI,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Execute AI trading decisions
app.post('/api/ai/execute', async (req, res) => {
    try {
        if (!zerodhaConnected) {
            return res.status(400).json({
                success: false,
                message: 'Zerodha not connected. Please connect first.'
            });
        }

        const { signals, portfolio } = req.body;
        
        if (!signals || !Array.isArray(signals)) {
            return res.status(400).json({
                success: false,
                message: 'Signals array is required'
            });
        }

        const executedTrades = await aiEngine.executeTrades(signals, portfolio, zerodhaAPI);

        res.json({
            success: true,
            executedTrades: executedTrades,
            message: `Executed ${executedTrades.length} trades`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get AI insights
app.get('/api/ai/insights', (req, res) => {
    try {
        const insights = aiEngine.getAIInsights();
        
        res.json({
            success: true,
            insights: insights,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Portfolio Routes

// Get portfolio status
app.get('/api/portfolio/status', async (req, res) => {
    try {
        if (!zerodhaConnected) {
            return res.status(400).json({
                success: false,
                message: 'Zerodha not connected. Please connect first.'
            });
        }

        const positions = await zerodhaAPI.getPositions();
        
        res.json({
            success: true,
            positions: positions.positions || [],
            mode: tradingMode,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get account details
app.get('/api/portfolio/account', async (req, res) => {
    try {
        if (!zerodhaConnected) {
            return res.status(400).json({
                success: false,
                message: 'Zerodha not connected. Please connect first.'
            });
        }

        const accountDetails = await zerodhaAPI.getAccountDetails();
        const holdings = await zerodhaAPI.getHoldings();
        
        res.json({
            success: true,
            account: accountDetails.profile,
            holdings: holdings.holdings || [],
            mode: tradingMode,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Place order
app.post('/api/portfolio/order', async (req, res) => {
    try {
        if (!zerodhaConnected) {
            return res.status(400).json({
                success: false,
                message: 'Zerodha not connected. Please connect first.'
            });
        }

        const orderParams = req.body;
        const result = await zerodhaAPI.placeOrder(orderParams);

        res.json({
            success: result.success,
            message: result.message,
            orderId: result.orderId,
            mode: result.mode || tradingMode,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Market Data Routes

// Get market data
app.get('/api/market-data', (req, res) => {
    res.json({
        success: true,
        data: realTimeData,
        timestamp: new Date().toISOString()
    });
});

// Update market data
app.post('/api/market-data/update', (req, res) => {
    const { data } = req.body;
    realTimeData = { ...realTimeData, ...data };
    
    res.json({
        success: true,
        message: 'Market data updated',
        timestamp: new Date().toISOString()
    });
});

// Get historical data
app.get('/api/market-data/historical/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { interval = 'day', duration = 50 } = req.query;
        
        if (!zerodhaConnected) {
            return res.status(400).json({
                success: false,
                message: 'Zerodha not connected. Please connect first.'
            });
        }

        const historicalData = await zerodhaAPI.getHistoricalData(symbol, interval, duration);
        
        res.json({
            success: true,
            data: historicalData.data,
            symbol: symbol,
            interval: interval,
            mode: historicalData.mode,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Screen Time Trading Platform Backend running on port ${PORT}`);
    console.log(`📊 Market data API: http://localhost:${PORT}/api/market-data`);
    console.log(`🔗 Zerodha API: http://localhost:${PORT}/api/zerodha/connect`);
    console.log(`🤖 AI Trading API: http://localhost:${PORT}/api/ai/signals`);
    console.log(`💼 Portfolio API: http://localhost:${PORT}/api/portfolio/status`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (wss) {
        console.log(`🔌 WebSocket server running on port ${wss.options.port} (development only)`);
    }
});
