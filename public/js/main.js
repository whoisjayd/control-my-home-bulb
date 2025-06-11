document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const loginScreen = document.getElementById('login');
    const dashboardScreen = document.getElementById('dashboard');
    const loadingOverlay = document.getElementById('loading');
    const apiKeyInput = document.getElementById('apiKey');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const toggleApiKey = document.getElementById('toggleApiKey');
    const eyeIcon = document.getElementById('eyeIcon');
    const statusIndicator = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const deviceName = document.getElementById('deviceName');
    const powerBtn = document.getElementById('powerBtn');
    const dimmerSlider = document.getElementById('dimmer');
    const ctSlider = document.getElementById('ct');
    const hueSlider = document.getElementById('hue');
    const saturationSlider = document.getElementById('saturation');
    const dimmerValue = document.getElementById('dimmerValue');
    const ctValue = document.getElementById('ctValue');
    const hueValue = document.getElementById('hueValue');
    const saturationValue = document.getElementById('saturationValue');
    const logsContainer = document.getElementById('logsContainer');
    const toggleLogsBtn = document.getElementById('toggleLogs');
    const toggleInfoBtn = document.getElementById('toggleInfo');
    const infoContainer = document.getElementById('infoContainer');
    const infoVersion = document.getElementById('infoVersion');
    const infoModule = document.getElementById('infoModule');
    const infoBootCount = document.getElementById('infoBootCount');
    const infoUptime = document.getElementById('infoUptime');
    const infoWifiSignal = document.getElementById('infoWifiSignal');
    const ipAddressInfo = document.getElementById('ipAddressInfo');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const logoutBtn = document.getElementById('logoutBtn');
    const activityIndicator = document.getElementById('activityIndicator');
    const installBtn = document.getElementById('installBtn'); // New selector for install button

    // --- State & Config ---
    let state = {};
    let statusInterval = null;
    let deferredPrompt; // To hold the install prompt event
    const API_BASE = window.API_BASE_URL || '/api';
    const POLLING_INTERVAL = 2500;
    const DEBOUNCE_DELAY = 150;
    
    // --- PWA Installation Logic ---
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can install the PWA
        installBtn.classList.remove('hidden');
        logToScreen('PWA install prompt is available.');
    });

    installBtn.addEventListener('click', async () => {
        // Hide the app provided install promotion
        installBtn.classList.add('hidden');
        if (!deferredPrompt) {
            logToScreen('Install prompt not available.');
            return;
        }
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        logToScreen(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        // Hide the install button if the app is installed
        installBtn.classList.add('hidden');
        deferredPrompt = null;
        logToScreen('PWA was installed successfully.');
    });

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/js/service-worker.js')
                .then(reg => logToScreen(`Service Worker registered.`))
                .catch(err => logToScreen(`Service Worker registration failed: ${err.message}`));
        });
    }

    // --- API Communication ---
    const apiCall = async (endpoint, method = 'GET', body = null, loaderType = 'subtle') => {
        try {
            if (loaderType === 'global') loadingOverlay.classList.remove('hidden');
            if (loaderType === 'subtle') activityIndicator.classList.remove('hidden');

            const headers = { 'Content-Type': 'application/json' };
            let url = `${API_BASE}${endpoint}`;
            const options = { method, headers };

            const savedApiKey = localStorage.getItem('apiKey');
            
            if (method === 'GET') {
                const urlObj = new URL(url, window.location.origin);
                if (savedApiKey) urlObj.searchParams.append('apiKey', savedApiKey);
                url = urlObj.toString();
            } else {
                const finalBody = endpoint === '/login' ? body : { ...(body || {}), apiKey: savedApiKey };
                options.body = JSON.stringify(finalBody);
            }

            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
                throw new Error(errorData.error || `HTTP error ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            logToScreen(`API Error: ${error.message}`);
            console.error(`API call error for ${endpoint}:`, error);
            if (error.message.includes('API key')) {
                loginError.textContent = 'Authentication failed. Please check the key.';
                handleLogout();
            }
            return { success: false, error: error.message };
        } finally {
            if (loaderType === 'global') loadingOverlay.classList.add('hidden');
            if (loaderType === 'subtle') activityIndicator.classList.add('hidden');
        }
    };

    // --- UI Update Logic ---
    const updateUI = (newState) => {
        if (!newState || typeof newState !== 'object') return;
        if (JSON.stringify(newState) === JSON.stringify(state)) return;
        
        state = newState;
        logToScreen(`State updated: online=${state.online}, power=${state.power}`);

        statusIndicator.className = `w-3 h-3 rounded-full ${state.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`;
        statusText.textContent = state.online ? 'Online' : 'Offline';
        deviceName.textContent = state.hostname || 'Bulb Control';
        ipAddressInfo.textContent = state.ip || 'N/A';

        powerBtn.classList.toggle('bg-yellow-400', state.power === 'ON');
        powerBtn.classList.toggle('text-gray-800', state.power === 'ON');
        powerBtn.classList.toggle('bg-gray-600', state.power !== 'ON');
        powerBtn.classList.toggle('text-white', state.power !== 'ON');

        if (document.activeElement !== dimmerSlider) {
            dimmerSlider.value = state.dimmer || 10;
            dimmerValue.textContent = `${state.dimmer || 10}%`;
        }
        if (document.activeElement !== ctSlider) {
            ctSlider.value = state.ct || 153;
            ctValue.textContent = `${state.ct || 153}K`;
        }
        if (document.activeElement !== hueSlider && document.activeElement !== saturationSlider) {
            const hsb = state.hsbColor ? state.hsbColor.split(',') : [0, 100, 0];
            hueSlider.value = hsb[0] || 0;
            hueValue.textContent = `${hsb[0] || 0}°`;
            saturationSlider.value = hsb[1] || 100;
            saturationValue.textContent = `${hsb[1] || 100}%`;
            updateSaturationSlider(hsb[0] || 0);
        }

        infoVersion.textContent = state.version || '...';
        infoModule.textContent = state.module || '...';
        infoBootCount.textContent = state.bootCount !== undefined ? state.bootCount : '...';
        infoUptime.textContent = state.wifi?.Uptime || '...';
        infoWifiSignal.textContent = state.wifi?.Signal ? `${state.wifi.Signal}%` : '...';
    };

    const updateSaturationSlider = (hue) => {
        saturationSlider.style.setProperty('--saturation-end-color', `hsl(${hue}, 100%, 50%)`);
    };

    // --- Event Handlers ---
    const handleLogin = async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            loginError.textContent = 'Please enter an API key.';
            return;
        }
        loginError.textContent = '';
        const response = await apiCall('/login', 'POST', { apiKey }, 'global');
        if (response.success) {
            localStorage.setItem('apiKey', apiKey);
            loginScreen.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                loginScreen.classList.add('hidden');
                dashboardScreen.classList.remove('hidden', 'opacity-0', 'scale-95');
                dashboardScreen.classList.add('opacity-100', 'scale-100');
                startPolling();
            }, 300);
        } else {
            localStorage.removeItem('apiKey');
            loginError.textContent = response.error || 'Invalid API key.';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('apiKey');
        clearInterval(statusInterval);
        statusInterval = null;
        dashboardScreen.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            dashboardScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden', 'opacity-0', 'scale-95');
            loginScreen.classList.add('opacity-100', 'scale-100');
            apiKeyInput.value = '';
        }, 300);
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };
    
    const handleDimmerChange = debounce((value) => {
        apiCall('/control/dimmer', 'POST', { value: parseInt(value) });
    }, DEBOUNCE_DELAY);

    const handleCtChange = debounce((value) => {
        apiCall('/control/ct', 'POST', { value: parseInt(value) });
    }, DEBOUNCE_DELAY);
    
    const handleHsbChange = debounce((hue, saturation) => {
        const dimmer = parseInt(dimmerSlider.value);
        apiCall('/control/hsb', 'POST', { hue: parseInt(hue), saturation: parseInt(saturation), dimmer });
    }, DEBOUNCE_DELAY);

    // --- Event Listeners ---
    loginBtn.addEventListener('click', handleLogin);
    apiKeyInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(e); });
    logoutBtn.addEventListener('click', handleLogout);
    powerBtn.addEventListener('click', () => apiCall('/control/power', 'POST', null, 'subtle').then(updateUI));

    dimmerSlider.addEventListener('input', (e) => {
        dimmerValue.textContent = `${e.target.value}%`;
        handleDimmerChange(e.target.value);
    });
    ctSlider.addEventListener('input', (e) => {
        ctValue.textContent = `${e.target.value}K`;
        handleCtChange(e.target.value);
    });
    hueSlider.addEventListener('input', (e) => {
        const hue = e.target.value;
        const saturation = saturationSlider.value;
        hueValue.textContent = `${hue}°`;
        updateSaturationSlider(hue);
        handleHsbChange(hue, saturation);
    });
    saturationSlider.addEventListener('input', (e) => {
        const saturation = e.target.value;
        const hue = hueSlider.value;
        saturationValue.textContent = `${saturation}%`;
        handleHsbChange(hue, saturation);
    });

    toggleInfoBtn.addEventListener('click', () => {
        const isHidden = infoContainer.classList.toggle('hidden');
        toggleInfoBtn.setAttribute('aria-expanded', String(!isHidden));
    });

    toggleLogsBtn.addEventListener('click', () => {
        const isHidden = logsContainer.classList.toggle('hidden');
        toggleLogsBtn.textContent = isHidden ? 'Show Live Logs' : 'Hide Live Logs';
        if (!isHidden) logsContainer.scrollTop = logsContainer.scrollHeight;
    });

    toggleApiKey.addEventListener('click', () => {
        const isPassword = apiKeyInput.type === 'password';
        apiKeyInput.type = isPassword ? 'text' : 'password';
        eyeIcon.innerHTML = isPassword 
            ? '<path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074L3.707 2.293zM10 12a2 2 0 11-4 0 2 2 0 014 0z" clip-rule="evenodd" /><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />' 
            : '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />';
    });

    const setTheme = (isDark) => {
        themeIcon.innerHTML = isDark 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
    };

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTheme(isDark);
    });

    // --- Polling for Status ---
    const fetchStatus = async () => {
        if (document.hidden) return;
        const newState = await apiCall('/status', 'GET', null, 'none');
        if (newState && newState.success !== false) {
            updateUI(newState);
        } else if (newState.error?.includes('API key')) {
            handleLogout();
        }
    };

    const startPolling = () => {
        if (statusInterval) clearInterval(statusInterval);
        fetchStatus();
        statusInterval = setInterval(fetchStatus, POLLING_INTERVAL);
    };

    // --- Logging ---
    const logToScreen = (message) => {
        if (logsContainer.children.length > 100) {
            logsContainer.removeChild(logsContainer.firstChild);
        }
        const logLine = document.createElement('div');
        logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logsContainer.appendChild(logLine);
        logsContainer.scrollTop = logsContainer.scrollHeight;
    };

    // --- Initialization ---
    const init = () => {
        setTheme(document.documentElement.classList.contains('dark'));
        const savedApiKey = localStorage.getItem('apiKey');
        if (savedApiKey) {
            apiKeyInput.value = savedApiKey;
            handleLogin();
        } else {
            loginScreen.classList.remove('hidden');
            loginScreen.classList.add('opacity-100', 'scale-100');
        }
    };

    init();
});
