// Optimized CC Generator - Core logic for API interaction
document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements once for better performance
    const elements = {
        form: document.querySelector('form'),
        resultTextarea: document.getElementById('result'),
        binInput: document.getElementById('bin'),
        monthInput: document.getElementById('month'),
        yearInput: document.getElementById('year'),
        cvcInput: document.getElementById('cvc'),
        quantityInput: document.getElementById('quantity'),
        generateButton: document.getElementById('generateBtn'),
        copyButton: document.getElementById('copyBtn'),
        resetButton: document.getElementById('resetBtn'),
        formatInput: document.getElementById('format'),
        currencyInput: document.getElementById('currency'),
        balanceInput: document.getElementById('balance')
    };

    // Debug: Check if all elements are found
    console.log('DOM elements loaded successfully');
    
    // Check if running locally and show warning
    if (window.location.protocol === 'file:') {
        console.warn('Site is running locally. API calls may fail due to CORS restrictions.');
        const resultTextarea = document.getElementById('result');
        if (resultTextarea && !resultTextarea.value) {
            resultTextarea.value = '⚠️ Local file detected. For full functionality, please run from a web server.\n\nYou can use:\n- Live Server (VS Code extension)\n- Python: python -m http.server\n- Node.js: npx serve\n\nOr deploy to GitHub Pages, Netlify, etc.';
        }
    }
    
    console.log('Available elements:', {
        form: !!elements.form,
        resultTextarea: !!elements.resultTextarea,
        binInput: !!elements.binInput,
        monthInput: !!elements.monthInput,
        yearInput: !!elements.yearInput,
        cvcInput: !!elements.cvcInput,
        quantityInput: !!elements.quantityInput,
        generateButton: !!elements.generateButton,
        copyButton: !!elements.copyButton,
        resetButton: !!elements.resetButton,
        formatInput: !!elements.formatInput,
        currencyInput: !!elements.currencyInput,
        balanceInput: !!elements.balanceInput
    });

    // API configuration
    const API_BASE_URL = 'https://cc-gen-lime.vercel.app/generate';
    const DEFAULT_QUANTITY = 10;
    const MAX_QUANTITY = 50;
    const BIN_STORAGE_KEY = 'elite_cc_gen_last_bin';
    const BIN_LIST_KEY = 'elite_cc_gen_bin_list';

    // Comprehensive BIN to CVC length mapping
    function getCvcLengthFromBin(bin) {
        if (!bin || bin.length < 1) return 3; // Default to 3 digits
        
        const firstDigit = bin.charAt(0);
        const firstTwoDigits = bin.substring(0, 2);
        const firstThreeDigits = bin.substring(0, 3);
        const firstFourDigits = bin.substring(0, 4);
        const firstSixDigits = bin.substring(0, 6);
        
        // 4-digit CVC cards
        if (firstDigit === '3') {
            // American Express: 34xxxx, 37xxxx
            if (firstTwoDigits === '34' || firstTwoDigits === '37') {
                return 4;
            }
            // Diners Club: 300xxx-305xxx, 36xxxx, 38xxxx
            if (firstThreeDigits >= '300' && firstThreeDigits <= '305') {
                return 4;
            }
            if (firstTwoDigits === '36' || firstTwoDigits === '38') {
                return 4;
            }
            // JCB: 35xxxx
            if (firstTwoDigits === '35') {
                return 4;
            }
            // Default for other 3xxxx BINs
            return 4;
        }
        
        // 3-digit CVC cards
        if (firstDigit === '4') {
            // Visa: 4xxxxx
            return 3;
        }
        
        if (firstDigit === '5') {
            // Mastercard: 51xxxx-55xxxx, 2221xx-2720xx
            if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
                return 3;
            }
            if (firstFourDigits >= '2221' && firstFourDigits <= '2720') {
                return 3;
            }
            return 3;
        }
        
        if (firstDigit === '6') {
            // Discover: 6011xx, 622126-622925, 624000-626999, 628200-628899, 65xxxx
            if (firstFourDigits === '6011') {
                return 3;
            }
            if (firstSixDigits >= '622126' && firstSixDigits <= '622925') {
                return 3;
            }
            if (firstSixDigits >= '624000' && firstSixDigits <= '626999') {
                return 3;
            }
            if (firstSixDigits >= '628200' && firstSixDigits <= '628899') {
                return 3;
            }
            if (firstTwoDigits === '65') {
                return 3;
            }
            return 3;
        }
        
        // Default to 3 digits for unknown BINs
        return 3;
    }

    // Get card type from BIN
    function getCardTypeFromBin(bin) {
        if (!bin || bin.length < 1) return 'Unknown';
        
        const firstDigit = bin.charAt(0);
        const firstTwoDigits = bin.substring(0, 2);
        const firstThreeDigits = bin.substring(0, 3);
        const firstFourDigits = bin.substring(0, 4);
        const firstSixDigits = bin.substring(0, 6);
        
        // American Express
        if (firstTwoDigits === '34' || firstTwoDigits === '37') {
            return 'American Express';
        }
        
        // Diners Club
        if (firstThreeDigits >= '300' && firstThreeDigits <= '305') {
            return 'Diners Club';
        }
        if (firstTwoDigits === '36' || firstTwoDigits === '38') {
            return 'Diners Club';
        }
        
        // JCB
        if (firstTwoDigits === '35') {
            return 'JCB';
        }
        
        // Visa
        if (firstDigit === '4') {
            return 'Visa';
        }
        
        // Mastercard
        if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
            return 'Mastercard';
        }
        if (firstFourDigits >= '2221' && firstFourDigits <= '2720') {
            return 'Mastercard';
        }
        
        // Discover
        if (firstFourDigits === '6011') {
            return 'Discover';
        }
        if (firstSixDigits >= '622126' && firstSixDigits <= '622925') {
            return 'Discover';
        }
        if (firstSixDigits >= '624000' && firstSixDigits <= '626999') {
            return 'Discover';
        }
        if (firstSixDigits >= '628200' && firstSixDigits <= '628899') {
            return 'Discover';
        }
        if (firstTwoDigits === '65') {
            return 'Discover';
        }
        
        // Default
        return 'Unknown';
    }

    // Generate CVC with specified length
    function generateCvc(length) {
        let cvc = '';
        for (let i = 0; i < length; i++) {
            cvc += Math.floor(Math.random() * 10);
        }
        return cvc;
    }

    // Prefill BIN and datalist from localStorage if available
    try {
        const savedBin = localStorage.getItem(BIN_STORAGE_KEY);
        if (savedBin && elements.binInput && !elements.binInput.value) {
            elements.binInput.value = savedBin;
        }
        const listJson = localStorage.getItem(BIN_LIST_KEY);
        const list = listJson ? JSON.parse(listJson) : [];
        const datalist = document.getElementById('binHistory');
        if (datalist && Array.isArray(list)) {
            datalist.innerHTML = '';
            list.slice(0, 20).forEach(v => {
                if (v && String(v).length >= 6) {
                    const opt = document.createElement('option');
                    opt.value = v;
                    datalist.appendChild(opt);
                }
            });
        }
    } catch (e) { /* ignore storage errors */ }

    // Set default quantity
    if (elements.quantityInput) {
        elements.quantityInput.value = DEFAULT_QUANTITY;
    }

    // Helper: update result placeholder based on format
    function updateResultPlaceholder(formatValue) {
        if (!elements.resultTextarea) return;
        // Keep placeholder empty per request
        elements.resultTextarea.placeholder = '';
    }

    // Initialize placeholder from current format
    if (elements.formatInput) {
        updateResultPlaceholder(elements.formatInput.value);
        elements.formatInput.addEventListener('change', (e) => {
            const val = e.target.value;
            updateResultPlaceholder(val);
        });
    }

    // Add toggle switch functionality
    const toggleSwitches = document.querySelectorAll('button[role="switch"]');
    console.log('Toggle switches initialized:', toggleSwitches.length);
    toggleSwitches.forEach((toggle, index) => {
        toggle.addEventListener('click', function() {
            console.log(`Toggle switch ${index} activated`);
            const isChecked = this.getAttribute('aria-checked') === 'true';
            const newState = !isChecked;
            
            this.setAttribute('aria-checked', newState);
            
            // Update visual state
            const thumb = this.querySelector('span[class*="translate-x"]');
            if (thumb) {
                if (newState) {
                    thumb.classList.remove('translate-x-0');
                    thumb.classList.add('translate-x-4');
                    this.classList.remove('bg-gray-700');
                    this.classList.add('bg-teal-700');
                } else {
                    thumb.classList.remove('translate-x-4');
                    thumb.classList.add('translate-x-0');
                    this.classList.remove('bg-teal-700');
                    this.classList.add('bg-gray-700');
                }
            }
            
            // Control fields based on toggle state
            if (index === 0) { // First toggle is for DATE
                const monthField = document.getElementById('month');
                const yearField = document.getElementById('year');
                
                if (monthField && yearField) {
                    if (newState) {
                        // Enable fields
                        monthField.disabled = false;
                        yearField.disabled = false;
                        monthField.style.opacity = '1';
                        yearField.style.opacity = '1';
                        console.log('Date fields enabled');
                    } else {
                        // Disable fields
                        monthField.disabled = true;
                        yearField.disabled = true;
                        monthField.style.opacity = '0.5';
                        yearField.style.opacity = '0.5';
                        monthField.value = '';
                        yearField.value = '';
                        console.log('Date fields disabled');
                    }
                }
            } else if (index === 1) { // Second toggle is for CVC
                const cvcField = document.getElementById('cvc');
                
                if (cvcField) {
                    if (newState) {
                        // Enable field
                        cvcField.disabled = false;
                        cvcField.style.opacity = '1';
                        console.log('CVC field enabled');
                    } else {
                        // Disable field
                        cvcField.disabled = true;
                        cvcField.style.opacity = '0.5';
                        cvcField.value = '';
                        console.log('CVC field disabled');
                    }
                }
            } else if (index === 2) { // Third toggle is for MONEY
                const currencyField = document.getElementById('currency');
                const balanceField = document.getElementById('balance');
                
                if (currencyField && balanceField) {
                    if (newState) {
                        // Enable fields
                        currencyField.disabled = false;
                        balanceField.disabled = false;
                        currencyField.style.opacity = '1';
                        balanceField.style.opacity = '1';
                        console.log('Money fields enabled');
                    } else {
                        // Disable fields
                        currencyField.disabled = true;
                        balanceField.disabled = true;
                        currencyField.style.opacity = '0.5';
                        balanceField.style.opacity = '0.5';
                        currencyField.value = '';
                        balanceField.value = '500-1000'; // Reset to default
                        console.log('Money fields disabled');
                    }
                }
            }
        });
    });

    // Apply initial state for date toggle on load so month/year work immediately
    function applyInitialDateToggleState() {
        const dateToggle = toggleSwitches[0];
        if (!dateToggle) return;
        const enabled = dateToggle.getAttribute('aria-checked') === 'true';
        const thumb = dateToggle.querySelector('span[class*="translate-x"]');
        // Ensure visual state matches aria state
        if (thumb) {
            if (enabled) {
                thumb.classList.remove('translate-x-0');
                thumb.classList.add('translate-x-4');
                dateToggle.classList.remove('bg-gray-700');
                dateToggle.classList.add('bg-teal-700');
            } else {
                thumb.classList.remove('translate-x-4');
                thumb.classList.add('translate-x-0');
                dateToggle.classList.remove('bg-teal-700');
                dateToggle.classList.add('bg-gray-700');
            }
        }
        // Enable/disable fields accordingly
        const monthField = document.getElementById('month');
        const yearField = document.getElementById('year');
        if (monthField && yearField) {
            monthField.disabled = !enabled;
            yearField.disabled = !enabled;
            monthField.style.opacity = enabled ? '1' : '0.5';
            yearField.style.opacity = enabled ? '1' : '0.5';
        }
        console.log('Date toggle initialized:', enabled ? 'enabled' : 'disabled');
    }

    // Apply initial state for CVC toggle on load (index 1)
    function applyInitialCvcToggleState() {
        const cvcToggle = toggleSwitches[1];
        if (!cvcToggle) return;
        const enabled = cvcToggle.getAttribute('aria-checked') === 'true';
        const thumb = cvcToggle.querySelector('span[class*="translate-x"]');
        // Ensure visual state matches aria state
        if (thumb) {
            if (enabled) {
                thumb.classList.remove('translate-x-0');
                thumb.classList.add('translate-x-4');
                cvcToggle.classList.remove('bg-gray-700');
                cvcToggle.classList.add('bg-teal-700');
            } else {
                thumb.classList.remove('translate-x-4');
                thumb.classList.add('translate-x-0');
                cvcToggle.classList.remove('bg-teal-700');
                cvcToggle.classList.add('bg-gray-700');
            }
        }
        // Enable/disable field accordingly
        const cvcField = document.getElementById('cvc');
        if (cvcField) {
            cvcField.disabled = !enabled;
            cvcField.style.opacity = enabled ? '1' : '0.5';
        }
        console.log('CVC toggle initialized:', enabled ? 'enabled' : 'disabled');
    }

    // Apply initial state for money toggle on load (index 2)
    function applyInitialMoneyToggleState() {
        const moneyToggle = toggleSwitches[2];
        if (!moneyToggle) return;
        const enabled = moneyToggle.getAttribute('aria-checked') === 'true';
        const thumb = moneyToggle.querySelector('span[class*="translate-x"]');
        // Ensure visual state matches aria state
        if (thumb) {
            if (enabled) {
                thumb.classList.remove('translate-x-0');
                thumb.classList.add('translate-x-4');
                moneyToggle.classList.remove('bg-gray-700');
                moneyToggle.classList.add('bg-teal-700');
            } else {
                thumb.classList.remove('translate-x-4');
                thumb.classList.add('translate-x-0');
                moneyToggle.classList.remove('bg-teal-700');
                moneyToggle.classList.add('bg-gray-700');
            }
        }
        // Enable/disable fields accordingly
        const currencyField = document.getElementById('currency');
        const balanceField = document.getElementById('balance');
        if (currencyField && balanceField) {
            currencyField.disabled = !enabled;
            balanceField.disabled = !enabled;
            currencyField.style.opacity = enabled ? '1' : '0.5';
            balanceField.style.opacity = enabled ? '1' : '0.5';
        }
        console.log('Money toggle initialized:', enabled ? 'enabled' : 'disabled');
    }

    // Event listener for the "Generate Cards" button
    if (elements.generateButton) {
        console.log('Generate button initialized');
        elements.generateButton.addEventListener('click', async (e) => {
            console.log('Generate button activated');
            e.preventDefault(); // Stop the form from submitting normally

            // Get and process the user's input
            let bin = elements.binInput.value.replace(/[^0-9]/g, ''); // Remove all non-numeric characters from the BIN
            
            // Extract the actual BIN digits (remove x's if present)
            if (bin.includes('x')) {
                bin = bin.replace(/x/g, '');
                console.log(`Extracted BIN from formatted input: ${bin}`);
            }
            let quantity = parseInt(elements.quantityInput.value, 10) || 10; // Use 10 as default quantity if not specified

            // Basic BIN validation before hitting API
            if (!bin || bin.length < 6) {
                elements.resultTextarea.value = 'Please enter a valid BIN (at least 6 digits).';
                return;
            }

            // Persist valid BIN for next visits
            try {
                localStorage.setItem(BIN_STORAGE_KEY, bin);
                // Update BIN list (unique, most recent first, cap 20)
                const listJson = localStorage.getItem(BIN_LIST_KEY);
                const list = listJson ? JSON.parse(listJson) : [];
                const filtered = list.filter(v => v !== bin);
                filtered.unshift(bin);
                localStorage.setItem(BIN_LIST_KEY, JSON.stringify(filtered.slice(0, 20)));
            } catch (e) { /* ignore */ }

            // Validate quantity
            if (!quantity || quantity < 1) {
                elements.resultTextarea.value = `Error: Please select a valid quantity.`;
                return; // Stop further execution
            }
            
            if (quantity > MAX_QUANTITY) {
                elements.resultTextarea.value = `Error: Quantity cannot exceed ${MAX_QUANTITY}.`;
                return; // Stop further execution
            }

            // Get form values
            // Check if date toggle is enabled
            const dateToggle = document.querySelectorAll('button[role="switch"]')[0];
            const dateToggleEnabled = dateToggle && dateToggle.getAttribute('aria-checked') === 'true';
            
            // Ensure month/year are resolved if toggle is ON
            const monthEl = elements.monthInput;
            const yearEl = elements.yearInput;
            const { monthVal, yearVal } = resolveMonthYearValues(dateToggleEnabled, monthEl, yearEl);
            
            const month = monthVal;
            const year = yearVal;
            let cvc = elements.cvcInput && elements.cvcInput.value ? elements.cvcInput.value : '';
            
            // Auto-set CVC length based on comprehensive BIN logic
            let cvcLength = 3; // Default
            if (!cvc || cvc.trim() === '') {
                cvcLength = getCvcLengthFromBin(bin);
                // Generate CVC manually with correct length
                cvc = generateCvc(cvcLength);
                console.log(`BIN ${bin} detected, generated ${cvcLength}-digit CVC: ${cvc}`);
            }
            
            const format = elements.formatInput ? elements.formatInput.value : 'pipe';
            const currency = elements.currencyInput && elements.currencyInput.value ? elements.currencyInput.value : '';
            const balance = elements.balanceInput ? elements.balanceInput.value : '';

            // Construct the API URL with query parameters based on user input
            let apiUrl = `${API_BASE_URL}?bin=${bin}&limit=${quantity}&format=${format}`;

            // Conditionally add month, year, and CVV to the URL if they are provided (not empty)
            if (month && month.trim() !== '') {
                apiUrl += `&month=${month}`;
            }
            if (year && year.trim() !== '') {
                // Your API uses a 2-digit year format (e.g., '28' for 2028)
                const lastTwoDigitsOfYear = year.slice(-2);
                apiUrl += `&year=${lastTwoDigitsOfYear}`;
            }
            if (cvc && cvc.trim() !== '') {
                apiUrl += `&cvv=${cvc}`;
            }
            if (currency && currency.trim() !== '') {
                apiUrl += `&currency=${currency}`;
            }
            if (balance && balance.trim() !== '') {
                apiUrl += `&balance=${balance}`;
            }

            // Display a loading message (centered if overlay exists)
            const overlay = document.getElementById('messageOverlay');
            if (overlay) {
                overlay.textContent = 'Generating cards... Please wait...';
                overlay.style.display = 'flex';
            } else {
                elements.resultTextarea.value = 'Generating cards... Please wait...';
            }
            
            // Debug: Log the values (remove this in production)
            console.log('Generation parameters:', {
                dateToggle: dateToggleEnabled ? 'enabled' : 'disabled',
                quantity: quantity,
                month: month || 'random',
                year: year || 'random',
                cvcLength: cvcLength,
                cvc: cvc || 'random',
                apiUrl: apiUrl
            });
            console.log('Full API URL:', apiUrl);
            console.log('Starting API request');

            try {
                // Add timeout to prevent infinite loading
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                // Make the GET request to your API
                const response = await fetch(apiUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                console.log('API response received:', response.status);
                if (!response.ok) {
                    // Friendly messages for common cases
                    if (response.status === 400) {
                        if (overlay) { overlay.textContent = 'Please enter a valid BIN.'; overlay.style.display = 'flex'; }
                        else { elements.resultTextarea.value = 'Please enter a valid BIN.'; }
                        return;
                    }
                    if (response.status >= 500) {
                        if (overlay) { overlay.textContent = 'Server is busy. Please try again later.'; overlay.style.display = 'flex'; }
                        else { elements.resultTextarea.value = 'Server is busy. Please try again later.'; }
                        return;
                    }
                    if (overlay) { overlay.textContent = 'Request failed. Please check inputs and try again.'; overlay.style.display = 'flex'; }
                    else { elements.resultTextarea.value = 'Request failed. Please check inputs and try again.'; }
                    return;
                }

                const data = await response.json();
                console.log('API response data:', data);
                console.log('Processing response data');
                console.log('Data type:', typeof data);
                console.log('Data keys:', Object.keys(data || {}));

                // Helper: build expiry string from parts
                const getExpiry = (cardObj) => {
                    if (cardObj.expiry) return cardObj.expiry; // already MM/YY
                    const mm = cardObj.month || cardObj.mm || cardObj.M || cardObj.MO;
                    const yy = cardObj.year ? String(cardObj.year).slice(-2) : (cardObj.yy || cardObj.YY);
                    if (mm && yy) return `${String(mm).padStart(2,'0')}/${String(yy).padStart(2,'0')}`;
                    return '';
                };

                // Check if money toggle is ON (index 2)
                const moneyToggle = toggleSwitches[2];
                const moneyToggleEnabled = moneyToggle && moneyToggle.getAttribute('aria-checked') === 'true';
                
                // Only include money values if toggle is ON AND values are actually selected
                const currencyValue = moneyToggleEnabled && currency && currency.trim() !== '' ? currency : '';
                const balanceValue = moneyToggleEnabled && balance && balance.trim() !== '' ? balance : '';
                
                console.log('Money toggle state:', {
                    toggleEnabled: moneyToggleEnabled,
                    currency: currencyValue,
                    balance: balanceValue
                });

                // Output formatter by format
                const formatCards = (cardsArr, fmt) => {
                    const f = (fmt || 'pipe').toLowerCase();
                    const hasMoneyData = currencyValue && balanceValue; // Only include if both values exist
                    
                    switch (f) {
                        case 'csv':
                            if (hasMoneyData) {
                                return cardsArr.map(c => `${c.number},${getExpiry(c)},${c.cvv},${currencyValue},${balanceValue}`).join('\n');
                            }
                            return cardsArr.map(c => `${c.number},${getExpiry(c)},${c.cvv}`).join('\n');
                        case 'sql':
                            if (hasMoneyData) {
                                return cardsArr.map(c => `INSERT INTO cards(number, month, year, cvv, currency, balance) VALUES ('${c.number}','${(getExpiry(c).split('/')[0]||'').padStart(2,'0')}','${(getExpiry(c).split('/')[1]||'')}','${c.cvv}','${currencyValue}','${balanceValue}');`).join('\n');
                            }
                            return cardsArr.map(c => `INSERT INTO cards(number, month, year, cvv) VALUES ('${c.number}','${(getExpiry(c).split('/')[0]||'').padStart(2,'0')}','${(getExpiry(c).split('/')[1]||'')}','${c.cvv}');`).join('\n');
                        case 'json':
                            if (hasMoneyData) {
                                return JSON.stringify(cardsArr.map(c => ({ number: c.number, month: (getExpiry(c).split('/')[0]||''), year: (getExpiry(c).split('/')[1]||''), cvv: c.cvv, currency: currencyValue, balance: balanceValue })), null, 2);
                            }
                            return JSON.stringify(cardsArr.map(c => ({ number: c.number, month: (getExpiry(c).split('/')[0]||''), year: (getExpiry(c).split('/')[1]||''), cvv: c.cvv })), null, 2);
                        case 'xml':
                            if (hasMoneyData) {
                                return cardsArr.map(c => `<card><number>${c.number}</number><month>${(getExpiry(c).split('/')[0]||'')}</month><year>${(getExpiry(c).split('/')[1]||'')}</year><cvv>${c.cvv}</cvv><currency>${currencyValue}</currency><balance>${balanceValue}</balance></card>`).join('\n');
                            }
                            return cardsArr.map(c => `<card><number>${c.number}</number><month>${(getExpiry(c).split('/')[0]||'')}</month><year>${(getExpiry(c).split('/')[1]||'')}</year><cvv>${c.cvv}</cvv></card>`).join('\n');
                        case 'pipe':
                        default:
                            if (hasMoneyData) {
                                return cardsArr.map(c => `${c.number}|${getExpiry(c)}|${c.cvv}|${currencyValue}|${balanceValue}`).join('\n');
                            }
                            return cardsArr.map(c => `${c.number}|${getExpiry(c)}|${c.cvv}`).join('\n');
                    }
                };

                // Hide overlay if showing
                if (overlay) overlay.style.display = 'none';
                // Check if the API returned cards and display them
                console.log('Checking data structure:', {
                    hasData: !!data,
                    hasCards: !!(data && data.cards),
                    cardsLength: data && data.cards ? data.cards.length : 0,
                    dataStructure: data
                });
                
                if (data && data.cards && data.cards.length > 0) {
                    // Override CVC values with correct length based on BIN
                    const cvcLength = getCvcLengthFromBin(bin);
                    data.cards.forEach(card => {
                        card.cvv = generateCvc(cvcLength);
                    });
                    console.log(`Overrode CVC values with ${cvcLength}-digit CVCs for ${data.cards.length} cards`);
                    
                    const generatedCards = formatCards(data.cards, format);
                    elements.resultTextarea.value = generatedCards;
                    console.log('Cards generated and displayed successfully');
                } else {
                    elements.resultTextarea.value = 'No cards were generated. Please check the BIN or API status.';
                    console.log('No cards received from API');
                }

            } catch (error) {
                // Network or unexpected errors
                console.log('Error occurred during generation:', error.message);
                
                // Clear loading message
                const overlay = document.getElementById('messageOverlay');
                let errorMessage = 'Network error. Please check your connection and try again.';
                
                // Check for specific error types
                if (error.name === 'AbortError') {
                    errorMessage = 'Request timeout. Please try again.';
                } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                    errorMessage = 'CORS error. Please run the site from a web server, not as a local file.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Cannot connect to API. Please check your internet connection.';
                }
                
                if (overlay) {
                    overlay.textContent = errorMessage;
                    overlay.style.display = 'flex';
                } else {
                    elements.resultTextarea.value = errorMessage;
                }
            }
        });
    }

    // Also save BIN on blur if user types a valid one
    if (elements.binInput) {
        elements.binInput.addEventListener('blur', () => {
            const val = (elements.binInput.value || '').replace(/[^0-9]/g, '');
            if (val && val.length >= 6) {
                try {
                    localStorage.setItem(BIN_STORAGE_KEY, val);
                    const listJson = localStorage.getItem(BIN_LIST_KEY);
                    const list = listJson ? JSON.parse(listJson) : [];
                    const filtered = list.filter(v => v !== val);
                    filtered.unshift(val);
                    localStorage.setItem(BIN_LIST_KEY, JSON.stringify(filtered.slice(0, 20)));
                    const datalist = document.getElementById('binHistory');
                    if (datalist) {
                        datalist.innerHTML = '';
                        filtered.slice(0, 20).forEach(v => {
                            const opt = document.createElement('option');
                            opt.value = v;
                            datalist.appendChild(opt);
                        });
                    }
                } catch (_) {}
            }
        });
        
        // Update CVC placeholder and BIN formatting based on BIN input
        elements.binInput.addEventListener('input', () => {
            let bin = elements.binInput.value.replace(/[^0-9]/g, '');
            
            // Auto-format BIN with x's after user-entered digits
            if (bin.length >= 6) {
                const binPart = bin; // Use the full BIN entered by user
                const remainingLength = 16 - bin.length; // Calculate remaining digits
                const xPart = 'x'.repeat(remainingLength);
                const formattedBin = binPart + xPart;
                
                // Only update if the current value doesn't already have the x's
                if (elements.binInput.value !== formattedBin) {
                    elements.binInput.value = formattedBin;
                    console.log(`BIN formatted: ${formattedBin} (using ${bin.length} digits)`);
                }
                
                // Use the full BIN for processing (not just first 6)
                bin = binPart;
            }
            
            const cvcInput = document.getElementById('cvc');
            if (cvcInput && bin.length >= 1) {
                const cvcLength = getCvcLengthFromBin(bin);
                const cardType = getCardTypeFromBin(bin);
                
                if (cvcLength === 4) {
                    cvcInput.placeholder = `Leave 4-digit CVC (${cardType})`;
                    console.log(`CVC placeholder updated for 4-digit ${cardType} cards`);
                } else {
                    cvcInput.placeholder = `Leave 3-digit CVC (${cardType})`;
                    console.log(`CVC placeholder updated for 3-digit ${cardType} cards`);
                }
            } else if (cvcInput) {
                cvcInput.placeholder = 'Leave blank to randomize';
            }
        });
    }

    // Event listener for the "Copy Cards" button
    if (elements.copyButton) {
        console.log('Copy button initialized');
        elements.copyButton.addEventListener('click', () => {
            console.log('Copy button activated');
            copy();
        });
    } else {
        console.log('Copy button not found');
    }

    // Event listener for the "Reset" button
    if (elements.resetButton) {
        console.log('Reset button initialized');
        elements.resetButton.addEventListener('click', () => {
            console.log('Reset button activated');
            resetForm();
        });
    } else {
        console.log('Reset button not found');
    }

    // Function to populate years
    function populateYears() {
        const currentYear = new Date().getFullYear();
        const endYear = currentYear + 15;
        elements.yearInput.innerHTML = '<option value="">Random</option>'; // Clear existing options

        for (let year = currentYear; year <= endYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            elements.yearInput.appendChild(option);
        }
    }

    // Function to populate months and handle current month; preserves current selection when possible
    function populateMonths() {
        if (!elements.monthInput || !elements.yearInput) return;
        const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed
        const currentYear = new Date().getFullYear();
        const selectedYear = parseInt(elements.yearInput.value, 10);
        const prev = elements.monthInput.value; // preserve previous selection

        elements.monthInput.innerHTML = '<option value="">Random</option>'; // Clear existing options

        let firstEnabled = '';
        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, '0');
            const option = document.createElement('option');
            option.value = monthStr;
            option.textContent = monthStr;

            // If the selected year is the current year, disable past months
            if (selectedYear === currentYear && month < currentMonth) {
                option.disabled = true;
            } else if (!firstEnabled) {
                firstEnabled = monthStr;
            }
            elements.monthInput.appendChild(option);
        }

        // Restore selection if still valid; otherwise keep Random
        if (prev) {
            const opt = Array.from(elements.monthInput.options).find(o => o.value === prev && !o.disabled);
            if (opt) {
                elements.monthInput.value = prev;
            }
        }
    }

    // Helper to pick a random non-empty value from a <select>
    function pickRandomOptionValue(selectEl) {
        if (!selectEl) return '';
        const validOptions = Array.from(selectEl.options).map(o => o.value).filter(v => v && String(v).trim() !== '');
        if (validOptions.length === 0) return '';
        const idx = Math.floor(Math.random() * validOptions.length);
        return validOptions[idx];
    }

    // Helper to read month/year values when date toggle is ON.
    // If user leaves them as Random (empty), we keep them empty so API will randomize.
    function resolveMonthYearValues(dateToggleEnabled, monthEl, yearEl) {
        const monthVal = dateToggleEnabled && monthEl ? (monthEl.value || '') : '';
        const yearVal  = dateToggleEnabled && yearEl  ? (yearEl.value  || '') : '';
        return { monthVal, yearVal };
    }

    // Initial population
    populateYears();
    populateMonths();
    // Re-apply toggle-driven state after options exist
    applyInitialDateToggleState();
    applyInitialCvcToggleState();
    applyInitialMoneyToggleState();

    // Legacy checkbox logic removed; toggle switches drive state now

    // Ensure current month/year is not selectable if checkbox is checked
    elements.monthInput.addEventListener('change', () => {
        const selectedMonth = parseInt(elements.monthInput.value, 10);
        const selectedYear = parseInt(elements.yearInput.value, 10);
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        if (elements.monthYearCheckbox && elements.monthYearCheckbox.checked) {
            if (selectedYear === currentYear && selectedMonth < currentMonth) {
                // If a past month is selected for the current year, reset to current month
                elements.monthInput.value = currentMonth.toString().padStart(2, '0');
            }
        }
    });

    elements.yearInput.addEventListener('change', () => {
        const selectedMonth = parseInt(elements.monthInput.value, 10);
        const selectedYear = parseInt(elements.yearInput.value, 10);
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Re-populate months based on the newly selected year to disable past months if applicable
        populateMonths();

        if (elements.monthYearCheckbox && elements.monthYearCheckbox.checked) {
            if (selectedYear === currentYear && selectedMonth < currentMonth) {
                // If the selected year is current year and selected month is past, adjust month
                elements.monthInput.value = currentMonth.toString().padStart(2, '0');
            }
        }
    });

});

// Optimized dropdown toggle function
function toggleDropdown(header) {
    const card = header.closest('.bin-dropdown-card');
    if (!card) return;
    
    const details = card.querySelector('.bin-dropdown-details');
    const arrow = card.querySelector('.bin-dropdown-arrow');
    
    if (details && arrow) {
        const isOpen = details.classList.contains('show');
        
        // Close all dropdowns first
        document.querySelectorAll('.bin-dropdown-details.show').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('.bin-dropdown-arrow.down').forEach(el => el.classList.remove('down'));
        
        // Open current dropdown if it wasn't open
        if (!isOpen) {
            details.classList.add('show');
            arrow.classList.add('down');
        }
    }
}

// Toast notification function
function showCopyNotification(message, isError = false, title = '') {
    // Backward-compatible wrapper to a richer toast
    // Ensure only one toast at a time
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    showToast({
        title: '',
        text: message,
        type: isError ? 'error' : 'success',
        duration: 1400
    });
}

// New generic toast function
function showToast({ title = 'Notice', text = '', type = 'info', duration = 2000 } = {}) {
    // Remove existing toasts to avoid duplicates
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    // Ultra-simple one-line content
    toast.textContent = (text || title || 'Done').trim();
    // Prefer to show inside the result container if available
    const container = document.querySelector('.right-panel .result-container') || document.querySelector('.result-container');
    if (container) {
        toast.classList.add('inbox');
        container.appendChild(toast);
    } else {
        document.body.appendChild(toast);
    }
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 220);
    }, Math.max(1200, duration));
}

// Optimized copy function
function copy() {
    console.log('Copy function activated');
    const textarea = document.getElementById('result');
    if (!textarea || !textarea.value.trim()) {
        console.log('No data available to copy');
        showCopyNotification("No data to copy, please generate first", true);
        return;
    }
    
    const textToCopy = textarea.value;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showCopyNotification("Data copied successfully");
                textarea.select();
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showCopyNotification("Copy failed, please try again", true);
            });
    } else {
        try {
            textarea.select();
            document.execCommand('copy');
            showCopyNotification("Data copied successfully");
        } catch (err) {
            console.error('Failed to copy: ', err);
            showCopyNotification("Copy failed, please try again", true);
        }
    }
}

function resetForm() {
    console.log('Reset function activated');
    // Reset all form inputs
    document.getElementById('bin').value = '';
    document.getElementById('month').value = '';
    document.getElementById('year').value = '';
    document.getElementById('cvc').value = '';
    document.getElementById('quantity').value = '10';
    document.getElementById('format').value = 'pipe';
    document.getElementById('currency').value = '';
    document.getElementById('balance').value = '500-1000';
    document.getElementById('result').value = '';
    
    console.log('Form reset completed');
    showCopyNotification("Form reset successfully");
}

// Optimized BIN value copy functionality
document.addEventListener('DOMContentLoaded', () => {
document.querySelectorAll('.bin-dropdown-value').forEach(element => {
    element.addEventListener('click', function() {
        const textToCopy = this.textContent;
            
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy)
                    .then(() => showCopyNotification("Data copied successfully"))
                    .catch(() => showCopyNotification("Copy failed, please try again", true));
        } else {
                // Fallback for older browsers
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = textToCopy;
                tempTextarea.style.position = 'fixed';
                tempTextarea.style.opacity = '0';
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
                try {
            document.execCommand('copy');
                    showCopyNotification("Data copied successfully");
                } catch (err) {
                    showCopyNotification("Copy failed, please try again", true);
                }
            document.body.removeChild(tempTextarea);
        }
        });
    });
});

// Optimized menu toggle function
      function toggleMenu() {
  const menu = document.getElementById('dropdown-menu');
    if (menu) {
  menu.classList.toggle('show');
    }
}

// Close menu when clicking outside
document.addEventListener('click', function (event) {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('dropdown-menu');

    if (menu && toggle && !menu.contains(event.target) && !toggle.contains(event.target)) {
    menu.classList.remove('show');
  }
});
