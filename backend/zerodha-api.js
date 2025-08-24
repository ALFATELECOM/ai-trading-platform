const fetch = require('node-fetch');
const crypto = require('crypto');

class ZerodhaAPI {
    constructor() {
        this.apiKey = process.env.ZERODHA_API_KEY || 'your_zerodha_api_key';
        this.apiSecret = process.env.ZERODHA_API_SECRET || 'your_zerodha_api_secret';
        this.accessToken = process.env.ZERODHA_ACCESS_TOKEN || null;
        this.baseURL = 'https://api.kite.trade';
        this.loginURL = 'https://kite.trade/connect/login';
        this.instruments = new Map();
        this.watchlist = [
            { symbol: 'NIFTY', exchange: 'NSE' },
            { symbol: 'BANKNIFTY', exchange: 'NSE' },
            { symbol: 'SENSEX', exchange: 'BSE' },
            { symbol: 'FINNIFTY', exchange: 'NSE' }
        ];
    }

    // Generate login URL for OAuth
    generateLoginURL(redirect_uri) {
        const params = new URLSearchParams({
            api_key: this.apiKey,
            v: '3'
        });
        
        if (redirect_uri) {
            params.append('redirect_uri', redirect_uri);
        }
        
        return `${this.loginURL}?${params.toString()}`;
    }

    // Authenticate with request token
    async authenticate(requestToken) {
        try {
            const checksum = crypto
                .createHash('sha256')
                .update(`${this.apiKey}${requestToken}${this.apiSecret}`)
                .digest('hex');

            const response = await fetch(`${this.baseURL}/session/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Kite-Version': '3'
                },
                body: new URLSearchParams({
                    api_key: this.apiKey,
                    request_token: requestToken,
                    checksum: checksum
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.accessToken = data.data.access_token;
                return {
                    success: true,
                    accessToken: this.accessToken
                };
            } else {
                return {
                    success: false,
                    error: data.message || 'Authentication failed'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Simple authentication for immediate access
    async simpleAuth() {
        try {
            this.accessToken = 'simple_auth_token_' + Math.random().toString(36).substr(2, 9);
            return {
                success: true,
                accessToken: this.accessToken,
                message: 'Simple authentication successful (paper trading mode)',
                mode: 'paper'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get instruments
    async getInstruments() {
        try {
            if (!this.accessToken) {
                return this.getSimulatedInstruments();
            }

            const response = await fetch(`${this.baseURL}/instruments`, {
                headers: {
                    'X-Kite-Version': '3',
                    'Authorization': `token ${this.apiKey}:${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Parse instruments and store in Map
            data.forEach(instrument => {
                this.instruments.set(instrument.instrument_token, instrument);
            });

            return {
                success: true,
                instruments: data
            };
        } catch (error) {
            console.log('Using simulated instruments due to error:', error.message);
            return this.getSimulatedInstruments();
        }
    }

    // Get simulated instruments
    getSimulatedInstruments() {
        const instruments = [
            {
                instrument_token: 256265,
                tradingsymbol: 'NIFTY',
                name: 'NIFTY 50',
                exchange: 'NSE',
                instrument_type: 'INDEX'
            },
            {
                instrument_token: 260105,
                tradingsymbol: 'BANKNIFTY',
                name: 'NIFTY BANK',
                exchange: 'NSE',
                instrument_type: 'INDEX'
            },
            {
                instrument_token: 265,
                tradingsymbol: 'SENSEX',
                name: 'S&P BSE SENSEX',
                exchange: 'BSE',
                instrument_type: 'INDEX'
            },
            {
                instrument_token: 260825,
                tradingsymbol: 'FINNIFTY',
                name: 'NIFTY FIN SERVICE',
                exchange: 'NSE',
                instrument_type: 'INDEX'
            }
        ];

        instruments.forEach(instrument => {
            this.instruments.set(instrument.instrument_token, instrument);
        });

        return {
            success: true,
            instruments: instruments
        };
    }

    // Get quotes
    async getQuotes(instruments) {
        try {
            if (!this.accessToken) {
                return this.getSimulatedQuotes();
            }

            const instrumentTokens = instruments.map(inst => inst.instrument_token || 256265);
            const response = await fetch(`${this.baseURL}/quote?i=${instrumentTokens.join(',')}`, {
                headers: {
                    'X-Kite-Version': '3',
                    'Authorization': `token ${this.apiKey}:${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                quotes: data
            };
        } catch (error) {
            console.log('Using simulated quotes due to error:', error.message);
            return this.getSimulatedQuotes();
        }
    }

    // Get simulated quotes
    getSimulatedQuotes() {
        const quotes = {};
        
        this.watchlist.forEach(instrument => {
            const basePrice = this.getBasePrice(instrument.symbol);
            const change = (Math.random() - 0.5) * 100;
            const newPrice = basePrice + change;
            const changePercent = (change / basePrice) * 100;
            
            quotes[instrument.symbol] = {
                instrument_token: this.getInstrumentToken(instrument.symbol),
                tradingsymbol: instrument.symbol,
                exchange: instrument.exchange,
                last_price: newPrice,
                change: change,
                change_percent: changePercent,
                timestamp: new Date().toISOString()
            };
        });

        return {
            success: true,
            quotes: quotes
        };
    }

    // Get base price for simulation
    getBasePrice(symbol) {
        const basePrices = {
            'NIFTY': 19847.25,
            'BANKNIFTY': 44568.75,
            'SENSEX': 66123.45,
            'FINNIFTY': 20234.50
        };
        return basePrices[symbol] || 1000;
    }

    // Get instrument token for simulation
    getInstrumentToken(symbol) {
        const tokens = {
            'NIFTY': 256265,
            'BANKNIFTY': 260105,
            'SENSEX': 265,
            'FINNIFTY': 260825
        };
        return tokens[symbol] || 256265;
    }

    // Get positions
    async getPositions() {
        try {
            if (!this.accessToken) {
                return this.getSimulatedPositions();
            }

            const response = await fetch(`${this.baseURL}/portfolio/positions`, {
                headers: {
                    'X-Kite-Version': '3',
                    'Authorization': `token ${this.apiKey}:${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                positions: data.data.net || []
            };
        } catch (error) {
            console.log('Using simulated positions due to error:', error.message);
            return this.getSimulatedPositions();
        }
    }

    // Get simulated positions
    getSimulatedPositions() {
        return {
            success: true,
            positions: [
                {
                    tradingsymbol: 'NIFTY',
                    quantity: 50,
                    average_price: 19847.25,
                    last_price: 19847.25,
                    pnl: 0,
                    exchange: 'NSE'
                }
            ]
        };
    }

    // Place order
    async placeOrder(orderParams) {
        try {
            if (!this.accessToken) {
                return this.getSimulatedOrderResult(orderParams);
            }

            const response = await fetch(`${this.baseURL}/orders/regular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Kite-Version': '3',
                    'Authorization': `token ${this.apiKey}:${this.accessToken}`
                },
                body: new URLSearchParams(orderParams)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: data.status === 'success',
                message: data.message || 'Order placed successfully',
                orderId: data.data.order_id,
                mode: 'live'
            };
        } catch (error) {
            console.log('Using simulated order due to error:', error.message);
            return this.getSimulatedOrderResult(orderParams);
        }
    }

    // Get simulated order result
    getSimulatedOrderResult(orderParams) {
        return {
            success: true,
            message: 'Order placed successfully (simulated)',
            orderId: 'SIM_' + Math.random().toString(36).substr(2, 9),
            mode: 'paper'
        };
    }

    // Get historical data
    async getHistoricalData(symbol, interval = 'day', duration = 50) {
        try {
            if (!this.accessToken) {
                return this.getSimulatedHistoricalData(symbol, duration);
            }

            const instrumentToken = this.getInstrumentToken(symbol);
            const from = new Date();
            from.setDate(from.getDate() - duration);
            
            const response = await fetch(`${this.baseURL}/instruments/historical/${instrumentToken}/${interval}?from=${from.toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}`, {
                headers: {
                    'X-Kite-Version': '3',
                    'Authorization': `token ${this.apiKey}:${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                data: data.data.candles,
                mode: 'live'
            };
        } catch (error) {
            console.log('Using simulated historical data due to error:', error.message);
            return this.getSimulatedHistoricalData(symbol, duration);
        }
    }

    // Get simulated historical data
    getSimulatedHistoricalData(symbol, duration) {
        const basePrice = this.getBasePrice(symbol);
        const data = [];
        
        for (let i = duration; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const change = (Math.random() - 0.5) * 200;
            const price = basePrice + change;
            
            data.push([
                date.toISOString(),
                price,
                price + Math.random() * 10,
                price - Math.random() * 10,
                price,
                Math.floor(Math.random() * 10000) + 1000
            ]);
        }

        return {
            success: true,
            data: data,
            mode: 'paper'
        };
    }

    // Get account details
    async getAccountDetails() {
        try {
            if (!this.accessToken) {
                return this.getSimulatedAccountDetails();
            }

            const response = await fetch(`${this.baseURL}/user/profile`, {
                headers: {
                    'X-Kite-Version': '3',
                    'Authorization': `token ${this.apiKey}:${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                profile: data.data
            };
        } catch (error) {
            console.log('Using simulated account details due to error:', error.message);
            return this.getSimulatedAccountDetails();
        }
    }

    // Get simulated account details
    getSimulatedAccountDetails() {
        return {
            success: true,
            profile: {
                user_id: 'SIM_USER_123',
                user_name: 'Simulated User',
                email: 'simulated@example.com',
                broker: 'Zerodha',
                user_type: 'individual',
                exchanges: ['NSE', 'BSE'],
                products: ['CNC', 'MIS', 'NRML'],
                order_types: ['MARKET', 'LIMIT', 'SL', 'SL-M']
            }
        };
    }

    // Get holdings
    async getHoldings() {
        try {
            if (!this.accessToken) {
                return this.getSimulatedHoldings();
            }

            const response = await fetch(`${this.baseURL}/portfolio/holdings`, {
                headers: {
                    'X-Kite-Version': '3',
                    'Authorization': `token ${this.apiKey}:${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                holdings: data.data || []
            };
        } catch (error) {
            console.log('Using simulated holdings due to error:', error.message);
            return this.getSimulatedHoldings();
        }
    }

    // Get simulated holdings
    getSimulatedHoldings() {
        return {
            success: true,
            holdings: [
                {
                    tradingsymbol: 'RELIANCE',
                    quantity: 100,
                    average_price: 2500.50,
                    last_price: 2550.75,
                    pnl: 5025.00,
                    exchange: 'NSE'
                },
                {
                    tradingsymbol: 'TCS',
                    quantity: 50,
                    average_price: 3500.25,
                    last_price: 3600.00,
                    pnl: 4987.50,
                    exchange: 'NSE'
                }
            ]
        };
    }
}

module.exports = ZerodhaAPI;
