// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://ai-trading-platform-uc2j.onrender.com'; // Production Render backend URL

// WebSocket configuration (development only)
const WS_URL = window.location.hostname === 'localhost' 
    ? 'ws://localhost:8083' 
    : null; // No WebSocket in production

// Global variables
let zerodhaConnected = false;
let tradingMode = 'paper';
let websocket = null;
let aiSignals = [];
let marketData = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Frontend initialized');
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('🔌 WebSocket URL:', WS_URL);
    
    // Show loading state
    showLoadingState();
    
    // Initialize immediately with fallback data
    useFallbackData();
    updateStatus();
    
    // Hide loading state immediately for faster perceived performance
    setTimeout(() => {
        hideLoadingState();
    }, 500);
    
    // Start market data polling after a short delay
    setTimeout(() => {
        startMarketDataPolling();
    }, 2000);
    
    // Connect WebSocket only in development
    if (WS_URL) {
        connectWebSocket();
    }
});

// Show loading state
function showLoadingState() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading AI Trading Platform...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

// Hide loading state
function hideLoadingState() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.style.opacity = '0';
        setTimeout(() => {
            loadingDiv.remove();
        }, 500);
    }
}

// Start polling for market data (production fallback)
function startMarketDataPolling() {
    console.log('📡 Starting market data polling...');
    
    // Initial fetch with timeout
    fetchMarketDataWithTimeout();
    
    // Poll market data every 15 seconds (optimized frequency)
    setInterval(fetchMarketDataWithTimeout, 15000);
}

// Fetch market data with timeout
async function fetchMarketDataWithTimeout() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced to 3 second timeout
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/market-data`, {
            signal: controller.signal,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.success) {
            console.log('📊 Received market data:', data.data);
            updateMarketData(data.data);
        } else {
            console.log('❌ Market data fetch failed:', data.error);
            useFallbackData();
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.log('❌ Market data polling failed:', error.message);
        useFallbackData();
    }
}

// Use fallback data immediately
function useFallbackData() {
    const fallbackData = {
        'NIFTY': { price: 19847.25, change: 125.50, changePercent: 0.64 },
        'BANKNIFTY': { price: 44568.75, change: 368.25, changePercent: 0.83 },
        'SENSEX': { price: 66123.45, change: 456.78, changePercent: 0.70 },
        'FINNIFTY': { price: 20234.50, change: -45.25, changePercent: -0.22 }
    };
    updateMarketData(fallbackData);
}

// Fetch market data from backend (legacy function - kept for compatibility)
async function fetchMarketData() {
    fetchMarketDataWithTimeout();
}

// Connect to Zerodha
async function connectZerodha() {
    const apiKey = document.getElementById('api-key').value;
    const apiSecret = document.getElementById('api-secret').value;
    const accessToken = document.getElementById('access-token').value;
    const mode = document.getElementById('trading-mode-select').value;
    
    if (!apiKey || !apiSecret) {
        showAlert('Please enter API Key and Secret', 'error');
        return;
    }

    const btnText = document.getElementById('connect-btn-text');
    btnText.innerHTML = '<span class="loading"></span> Connecting...';
    
    console.log('🔗 Connecting to Zerodha...');
    console.log('🌐 API URL:', `${API_BASE_URL}/api/zerodha/connect`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/zerodha/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey,
                apiSecret,
                accessToken,
                mode
            })
        });

        const data = await response.json();
        console.log('📡 Zerodha connection response:', data);
        
        if (data.success) {
            zerodhaConnected = true;
            tradingMode = data.mode;
            showAlert(data.message, 'success');
            updateStatus();
            refreshMarketData();
        } else {
            showAlert(data.error || 'Connection failed', 'error');
        }
    } catch (error) {
        console.error('❌ Zerodha connection error:', error);
        showAlert('Connection failed: ' + error.message, 'error');
    } finally {
        btnText.textContent = '🔗 Connect to Zerodha';
    }
}

// Generate login URL for OAuth
async function generateLoginURL() {
    const apiKey = document.getElementById('api-key').value;
    const apiSecret = document.getElementById('api-secret').value;
    
    if (!apiKey || !apiSecret) {
        showAlert('Please enter API Key and Secret first', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/zerodha/login-url?apiKey=${apiKey}&apiSecret=${apiSecret}`);
        const data = await response.json();
        
        if (data.success) {
            window.open(data.loginURL, '_blank', 'width=800,height=600');
            showAlert('Login URL opened in new window. Complete authentication there.', 'success');
        } else {
            showAlert('Failed to generate login URL', 'error');
        }
    } catch (error) {
        showAlert('Failed to generate login URL: ' + error.message, 'error');
    }
}

// Refresh market data
async function refreshMarketData() {
    console.log('🔄 Manual refresh requested');
    
    // Test with simulated data first
    const testData = {
        'NIFTY': { price: 19847.25 + Math.random() * 100, change: 125.50 + Math.random() * 20, changePercent: 0.64 + Math.random() * 2 },
        'BANKNIFTY': { price: 44568.75 + Math.random() * 200, change: 368.25 + Math.random() * 30, changePercent: 0.83 + Math.random() * 1 },
        'SENSEX': { price: 66123.45 + Math.random() * 300, change: 456.78 + Math.random() * 40, changePercent: 0.70 + Math.random() * 1.5 },
        'FINNIFTY': { price: 20234.50 + Math.random() * 150, change: -45.25 + Math.random() * 25, changePercent: -0.22 + Math.random() * 1 }
    };
    
    console.log('🧪 Testing with simulated data:', testData);
    updateMarketData(testData);
    
    if (!zerodhaConnected) {
        showAlert('Using simulated data (Zerodha not connected)', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/zerodha/live-prices`);
        const data = await response.json();
        
        if (data.success) {
            updateMarketData(data.prices);
            showAlert('Market data refreshed', 'success');
        } else {
            showAlert('Failed to refresh market data', 'error');
        }
    } catch (error) {
        showAlert('Failed to refresh market data: ' + error.message, 'error');
    }
}

// Update market data display
function updateMarketData(prices) {
    console.log('🔄 Updating market data for symbols:', Object.keys(prices));
    Object.keys(prices).forEach(symbol => {
        const priceElement = document.getElementById(`${symbol.toLowerCase()}-price`);
        const changeElement = document.getElementById(`${symbol.toLowerCase()}-change`);
        
        console.log(`🔍 Looking for elements: ${symbol.toLowerCase()}-price and ${symbol.toLowerCase()}-change`);
        console.log(`📊 Found price element:`, priceElement);
        console.log(`📊 Found change element:`, changeElement);
        
        if (priceElement && changeElement) {
            const quote = prices[symbol];
            console.log(`💰 Updating ${symbol} with price: ${quote.price}, change: ${quote.change}, changePercent: ${quote.changePercent}`);
            priceElement.textContent = quote.price.toFixed(2);
            
            const changeText = `${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`;
            changeElement.textContent = changeText;
            changeElement.className = `change ${quote.change >= 0 ? 'positive' : 'negative'}`;
        } else {
            console.log(`❌ Elements not found for symbol: ${symbol}`);
        }
    });
    
    updateLastUpdate();
}

// Generate AI signals
async function generateAISignals() {
    if (!zerodhaConnected) {
        showAlert('Please connect to Zerodha first', 'warning');
        return;
    }

    const btnText = document.getElementById('ai-btn-text');
    btnText.innerHTML = '<span class="loading"></span> Generating...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/signals`);
        const data = await response.json();
        
        if (data.success) {
            aiSignals = data.signals;
            updateAISignals(data.signals);
            updateAIInsights(data.insights);
            showAlert(`Generated ${data.signals.length} AI signals`, 'success');
        } else {
            showAlert('Failed to generate AI signals', 'error');
        }
    } catch (error) {
        showAlert('Failed to generate AI signals: ' + error.message, 'error');
    } finally {
        btnText.textContent = '🧠 Generate AI Signals';
    }
}

// Execute AI trades
async function executeAITrades() {
    if (!zerodhaConnected) {
        showAlert('Please connect to Zerodha first', 'warning');
        return;
    }

    if (aiSignals.length === 0) {
        showAlert('Please generate AI signals first', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                signals: aiSignals,
                portfolio: { balance: 100000 }
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showAlert(`Executed ${data.executedTrades.length} trades successfully`, 'success');
        } else {
            showAlert('Failed to execute trades', 'error');
        }
    } catch (error) {
        showAlert('Failed to execute trades: ' + error.message, 'error');
    }
}

// Get AI insights
async function getAIInsights() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/ai/insights`);
        const data = await response.json();
        
        if (data.success) {
            updateAIInsights(data.insights);
            showAlert('AI insights updated', 'success');
        } else {
            showAlert('Failed to get AI insights', 'error');
        }
    } catch (error) {
        showAlert('Failed to get AI insights: ' + error.message, 'error');
    }
}

// Update AI signals display
function updateAISignals(signals) {
    const container = document.getElementById('ai-signals');
    container.innerHTML = '';
    
    signals.forEach(signal => {
        const signalElement = document.createElement('div');
        signalElement.className = `signal-item ${signal.type.toLowerCase()}`;
        signalElement.innerHTML = `
            <div class="signal-header">
                <span class="signal-type ${signal.type.toLowerCase()}">${signal.type}</span>
                <span class="signal-strength">Strength: ${Math.round(signal.strength * 100)}%</span>
            </div>
            <div class="signal-reason">${signal.symbol} - ${signal.reason}</div>
        `;
        container.appendChild(signalElement);
    });
}

// Update AI insights display
function updateAIInsights(insights) {
    document.getElementById('market-sentiment').textContent = insights.marketSentiment;
    document.getElementById('market-sentiment').className = `sentiment ${insights.marketSentiment}`;
}

// Get portfolio status
async function getPortfolioStatus() {
    if (!zerodhaConnected) {
        showAlert('Please connect to Zerodha first', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/portfolio/status`);
        const data = await response.json();
        
        if (data.success) {
            updatePortfolioDisplay(data);
            showAlert('Portfolio status updated', 'success');
        } else {
            showAlert('Failed to get portfolio status', 'error');
        }
    } catch (error) {
        showAlert('Failed to get portfolio status: ' + error.message, 'error');
    }
}

// Get account details
async function getAccountDetails() {
    if (!zerodhaConnected) {
        showAlert('Please connect to Zerodha first', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/portfolio/account`);
        const data = await response.json();
        
        if (data.success) {
            updateAccountDisplay(data);
            showAlert('Account details updated', 'success');
        } else {
            showAlert('Failed to get account details', 'error');
        }
    } catch (error) {
        showAlert('Failed to get account details: ' + error.message, 'error');
    }
}

// Update portfolio display
function updatePortfolioDisplay(data) {
    const container = document.getElementById('portfolio-content');
    
    if (data.positions && data.positions.length > 0) {
        let html = '<div style="display: grid; gap: 15px;">';
        data.positions.forEach(position => {
            html += `
                <div style="background: #f8fafc; padding: 15px; border-radius: 10px;">
                    <h4>${position.tradingsymbol}</h4>
                    <p>Quantity: ${position.quantity}</p>
                    <p>Entry Price: ₹${position.average_price}</p>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p style="color: #666; text-align: center;">No active positions</p>';
    }
}

// Update account display
function updateAccountDisplay(data) {
    const container = document.getElementById('account-content');
    
    if (data.account) {
        let html = `
            <div class="account-info">
                <h3>Account Information</h3>
                <div class="account-details">
                    <div class="detail-item">
                        <div class="detail-label">User ID</div>
                        <div class="detail-value">${data.account.user_id}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Name</div>
                        <div class="detail-value">${data.account.user_name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${data.account.email}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Broker</div>
                        <div class="detail-value">${data.account.broker}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">User Type</div>
                        <div class="detail-value">${data.account.user_type}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Exchanges</div>
                        <div class="detail-value">${data.account.exchanges.join(', ')}</div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p style="color: #666; text-align: center;">No account information available</p>';
    }
}

// Show tab content
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Place order (placeholder)
function placeOrder() {
    showAlert('Order placement feature coming soon', 'warning');
}

// Update status display
function updateStatus() {
    const statusIndicator = document.getElementById('connection-status');
    const statusText = document.getElementById('connection-text');
    const modeText = document.getElementById('trading-mode');
    
    if (zerodhaConnected) {
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'Connected';
        modeText.textContent = tradingMode === 'live' ? 'Live Trading' : 'Paper Trading';
    } else {
        statusIndicator.className = 'status-indicator';
        statusText.textContent = 'Disconnected';
        modeText.textContent = 'Not Connected';
    }
}

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString();
}

// Show alert
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
