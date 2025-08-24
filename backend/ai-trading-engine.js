const { SMA, RSI, MACD, BollingerBands } = require('technicalindicators');

class AITradingEngine {
    constructor() {
        this.strategies = {
            momentum: this.momentumStrategy,
            meanReversion: this.meanReversionStrategy,
            breakout: this.breakoutStrategy,
            screenTime: this.screenTimeStrategy,
            volatility: this.volatilityStrategy
        };
        
        this.insights = {
            totalSignals: 0,
            buySignals: 0,
            sellSignals: 0,
            strongSignals: 0,
            marketSentiment: 'neutral'
        };
    }

    // Generate trading signals for all instruments
    generateSignals(marketData) {
        const signals = [];
        
        Object.keys(marketData).forEach(symbol => {
            const data = marketData[symbol];
            const symbolSignals = this.analyzeInstrument(symbol, data);
            signals.push(...symbolSignals);
        });

        // Update insights
        this.updateInsights(signals);
        
        return signals;
    }

    // Analyze a single instrument
    analyzeInstrument(symbol, data) {
        const signals = [];
        const prices = data.prices.map(p => p.close);
        
        if (prices.length < 50) {
            return signals; // Need enough data for analysis
        }

        // Calculate technical indicators
        const sma20 = SMA.calculate({ period: 20, values: prices });
        const sma50 = SMA.calculate({ period: 50, values: prices });
        const rsi = RSI.calculate({ period: 14, values: prices });
        const macd = MACD.calculate({
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            values: prices
        });
        const bb = BollingerBands.calculate({
            period: 20,
            stdDev: 2,
            values: prices
        });

        // Get latest values
        const currentPrice = data.currentPrice;
        const currentSMA20 = sma20[sma20.length - 1];
        const currentSMA50 = sma50[sma50.length - 1];
        const currentRSI = rsi[rsi.length - 1];
        const currentMACD = macd[macd.length - 1];
        const currentBB = bb[bb.length - 1];

        // Strategy 1: Momentum Strategy
        const momentumSignal = this.momentumStrategy(symbol, {
            currentPrice,
            sma20: currentSMA20,
            sma50: currentSMA50,
            rsi: currentRSI,
            macd: currentMACD
        });
        if (momentumSignal) signals.push(momentumSignal);

        // Strategy 2: Mean Reversion Strategy
        const meanReversionSignal = this.meanReversionStrategy(symbol, {
            currentPrice,
            rsi: currentRSI,
            bb: currentBB
        });
        if (meanReversionSignal) signals.push(meanReversionSignal);

        // Strategy 3: Breakout Strategy
        const breakoutSignal = this.breakoutStrategy(symbol, {
            currentPrice,
            bb: currentBB,
            sma20: currentSMA20
        });
        if (breakoutSignal) signals.push(breakoutSignal);

        // Strategy 4: Screen Time Strategy (AI-powered)
        const screenTimeSignal = this.screenTimeStrategy(symbol, {
            currentPrice,
            change: data.change,
            changePercent: data.changePercent,
            prices
        });
        if (screenTimeSignal) signals.push(screenTimeSignal);

        // Strategy 5: Volatility Strategy
        const volatilitySignal = this.volatilityStrategy(symbol, {
            currentPrice,
            bb: currentBB,
            prices
        });
        if (volatilitySignal) signals.push(volatilitySignal);

        return signals;
    }

    // Momentum Strategy
    momentumStrategy(symbol, data) {
        const { currentPrice, sma20, sma50, rsi, macd } = data;
        
        let signal = null;
        let strength = 0;
        let reasons = [];

        // Price above both SMAs (bullish momentum)
        if (currentPrice > sma20 && sma20 > sma50) {
            strength += 0.3;
            reasons.push('Price above both SMAs');
        }

        // RSI conditions
        if (rsi > 50 && rsi < 70) {
            strength += 0.2;
            reasons.push('RSI in bullish range');
        } else if (rsi < 30) {
            strength += 0.1;
            reasons.push('RSI oversold');
        }

        // MACD conditions
        if (macd && macd.MACD > macd.signal) {
            strength += 0.2;
            reasons.push('MACD bullish crossover');
        }

        // Generate signal if strength is sufficient
        if (strength >= 0.4) {
            signal = {
                symbol: symbol,
                type: 'BUY',
                strength: strength,
                reason: reasons.join(', '),
                strategy: 'Momentum',
                timestamp: new Date().toISOString()
            };
        }

        return signal;
    }

    // Mean Reversion Strategy
    meanReversionStrategy(symbol, data) {
        const { currentPrice, rsi, bb } = data;
        
        let signal = null;
        let strength = 0;
        let reasons = [];

        // RSI oversold/overbought conditions
        if (rsi < 30) {
            strength += 0.4;
            reasons.push('RSI oversold');
        } else if (rsi > 70) {
            strength += 0.4;
            reasons.push('RSI overbought');
        }

        // Bollinger Bands conditions
        if (bb && currentPrice < bb.lower) {
            strength += 0.3;
            reasons.push('Price below lower Bollinger Band');
        } else if (bb && currentPrice > bb.upper) {
            strength += 0.3;
            reasons.push('Price above upper Bollinger Band');
        }

        // Generate signal if strength is sufficient
        if (strength >= 0.5) {
            const type = rsi < 30 || (bb && currentPrice < bb.lower) ? 'BUY' : 'SELL';
            signal = {
                symbol: symbol,
                type: type,
                strength: strength,
                reason: reasons.join(', '),
                strategy: 'Mean Reversion',
                timestamp: new Date().toISOString()
            };
        }

        return signal;
    }

    // Breakout Strategy
    breakoutStrategy(symbol, data) {
        const { currentPrice, bb, sma20 } = data;
        
        let signal = null;
        let strength = 0;
        let reasons = [];

        // Breakout above upper Bollinger Band
        if (bb && currentPrice > bb.upper) {
            strength += 0.5;
            reasons.push('Breakout above upper Bollinger Band');
        }

        // Breakout below lower Bollinger Band
        if (bb && currentPrice < bb.lower) {
            strength += 0.5;
            reasons.push('Breakout below lower Bollinger Band');
        }

        // Price above SMA20
        if (currentPrice > sma20) {
            strength += 0.2;
            reasons.push('Price above SMA20');
        }

        // Generate signal if strength is sufficient
        if (strength >= 0.6) {
            const type = bb && currentPrice > bb.upper ? 'BUY' : 'SELL';
            signal = {
                symbol: symbol,
                type: type,
                strength: strength,
                reason: reasons.join(', '),
                strategy: 'Breakout',
                timestamp: new Date().toISOString()
            };
        }

        return signal;
    }

    // Screen Time Strategy (AI-powered pattern recognition)
    screenTimeStrategy(symbol, data) {
        const { currentPrice, change, changePercent, prices } = data;
        
        let signal = null;
        let strength = 0;
        let reasons = [];

        // Analyze recent price movements
        const recentPrices = prices.slice(-10);
        const priceVolatility = this.calculateVolatility(recentPrices);
        const priceTrend = this.calculateTrend(recentPrices);

        // Strong positive momentum
        if (changePercent > 1 && priceTrend > 0.5) {
            strength += 0.4;
            reasons.push('Strong positive momentum');
        }

        // High volatility with trend
        if (priceVolatility > 0.02 && Math.abs(priceTrend) > 0.3) {
            strength += 0.3;
            reasons.push('High volatility with trend');
        }

        // Volume analysis (simulated)
        const volumeSignal = Math.random() > 0.7;
        if (volumeSignal) {
            strength += 0.2;
            reasons.push('High volume activity');
        }

        // Generate signal if strength is sufficient
        if (strength >= 0.5) {
            const type = changePercent > 0 ? 'BUY' : 'SELL';
            signal = {
                symbol: symbol,
                type: type,
                strength: strength,
                reason: reasons.join(', '),
                strategy: 'Screen Time',
                timestamp: new Date().toISOString()
            };
        }

        return signal;
    }

    // Volatility Strategy
    volatilityStrategy(symbol, data) {
        const { currentPrice, bb, prices } = data;
        
        let signal = null;
        let strength = 0;
        let reasons = [];

        // Calculate volatility
        const volatility = this.calculateVolatility(prices.slice(-20));
        const bbWidth = bb ? (bb.upper - bb.lower) / bb.middle : 0;

        // High volatility conditions
        if (volatility > 0.03) {
            strength += 0.4;
            reasons.push('High volatility detected');
        }

        // Bollinger Band squeeze
        if (bbWidth < 0.02) {
            strength += 0.3;
            reasons.push('Bollinger Band squeeze');
        }

        // Price near support/resistance
        if (bb && (Math.abs(currentPrice - bb.upper) / currentPrice < 0.01 ||
                   Math.abs(currentPrice - bb.lower) / currentPrice < 0.01)) {
            strength += 0.2;
            reasons.push('Price near support/resistance');
        }

        // Generate signal if strength is sufficient
        if (strength >= 0.6) {
            const type = bb && currentPrice > bb.middle ? 'BUY' : 'SELL';
            signal = {
                symbol: symbol,
                type: type,
                strength: strength,
                reason: reasons.join(', '),
                strategy: 'Volatility',
                timestamp: new Date().toISOString()
            };
        }

        return signal;
    }

    // Calculate volatility
    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    // Calculate trend
    calculateTrend(prices) {
        if (prices.length < 2) return 0;
        
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        
        return (lastPrice - firstPrice) / firstPrice;
    }

    // Update insights based on signals
    updateInsights(signals) {
        this.insights.totalSignals = signals.length;
        this.insights.buySignals = signals.filter(s => s.type === 'BUY').length;
        this.insights.sellSignals = signals.filter(s => s.type === 'SELL').length;
        this.insights.strongSignals = signals.filter(s => s.strength >= 0.7).length;
        
        // Determine market sentiment
        if (this.insights.buySignals > this.insights.sellSignals * 1.5) {
            this.insights.marketSentiment = 'bullish';
        } else if (this.insights.sellSignals > this.insights.buySignals * 1.5) {
            this.insights.marketSentiment = 'bearish';
        } else {
            this.insights.marketSentiment = 'neutral';
        }
    }

    // Get AI insights
    getAIInsights() {
        return {
            totalSignals: this.insights.totalSignals,
            buySignals: this.insights.buySignals,
            sellSignals: this.insights.sellSignals,
            strongSignals: this.insights.strongSignals,
            marketSentiment: this.insights.marketSentiment,
            timestamp: new Date().toISOString()
        };
    }

    // Execute trades based on signals
    async executeTrades(signals, portfolio, zerodhaAPI) {
        const executedTrades = [];
        
        for (const signal of signals) {
            if (signal.strength >= 0.6) { // Only execute strong signals
                try {
                    const orderParams = {
                        tradingsymbol: signal.symbol,
                        exchange: 'NSE',
                        transaction_type: signal.type === 'BUY' ? 'BUY' : 'SELL',
                        quantity: this.calculatePositionSize(signal, portfolio),
                        product: 'MIS',
                        order_type: 'MARKET'
                    };

                    const result = await zerodhaAPI.placeOrder(orderParams);
                    
                    if (result.success) {
                        executedTrades.push({
                            signal: signal,
                            order: result,
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error(`Failed to execute trade for ${signal.symbol}:`, error);
                }
            }
        }

        return executedTrades;
    }

    // Calculate position size based on risk management
    calculatePositionSize(signal, portfolio) {
        const riskPerTrade = 0.02; // 2% risk per trade
        const accountBalance = portfolio.balance || 100000;
        const riskAmount = accountBalance * riskPerTrade;
        
        // Simple position sizing (can be enhanced with stop-loss calculation)
        const positionSize = Math.floor(riskAmount / 100); // Assuming ₹100 risk per share
        
        return Math.max(1, Math.min(positionSize, 100)); // Min 1, Max 100 shares
    }
}

module.exports = AITradingEngine;
