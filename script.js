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
    console.log('Elements found:', {
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
    console.log('Toggle switches found:', toggleSwitches.length);
    toggleSwitches.forEach((toggle, index) => {
        toggle.addEventListener('click', function() {
            console.log(`Toggle switch ${index} clicked!`);
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
            
            // Control month and year fields based on toggle state
            if (index === 0) { // First toggle is for date
                const monthField = document.getElementById('month');
                const yearField = document.getElementById('year');
                
                if (monthField && yearField) {
                    if (newState) {
                        // Enable fields
                        monthField.disabled = false;
                        yearField.disabled = false;
                        monthField.style.opacity = '1';
                        yearField.style.opacity = '1';
                        console.log('Month and Year fields ENABLED');
                    } else {
                        // Disable fields
                        monthField.disabled = true;
                        yearField.disabled = true;
                        monthField.style.opacity = '0.5';
                        yearField.style.opacity = '0.5';
                        monthField.value = '';
                        yearField.value = '';
                        console.log('Month and Year fields DISABLED');
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
        console.log('Initial date toggle applied. Enabled:', enabled);
    }

    // Event listener for the "Generate Cards" button
    if (elements.generateButton) {
        console.log('Generate button found and event listener added');
        elements.generateButton.addEventListener('click', async (e) => {
            console.log('Generate button clicked!');
            e.preventDefault(); // Stop the form from submitting normally

            // Get and process the user's input
            const bin = elements.binInput.value.replace(/[^0-9]/g, ''); // Remove all non-numeric characters from the BIN
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
            const cvc = elements.cvcInput && elements.cvcInput.value ? elements.cvcInput.value : '';
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
            console.log('Date toggle enabled:', dateToggleEnabled);
            console.log('Quantity:', quantity);
            console.log('Month:', month);
            console.log('Year:', year);
            console.log('API URL:', apiUrl);

            try {
                // Make the GET request to your API
                const response = await fetch(apiUrl);
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

                // Helper: build expiry string from parts
                const getExpiry = (cardObj) => {
                    if (cardObj.expiry) return cardObj.expiry; // already MM/YY
                    const mm = cardObj.month || cardObj.mm || cardObj.M || cardObj.MO;
                    const yy = cardObj.year ? String(cardObj.year).slice(-2) : (cardObj.yy || cardObj.YY);
                    if (mm && yy) return `${String(mm).padStart(2,'0')}/${String(yy).padStart(2,'0')}`;
                    return '';
                };

                // Output formatter by format
                const formatCards = (cardsArr, fmt) => {
                    const f = (fmt || 'pipe').toLowerCase();
                    switch (f) {
                        case 'csv':
                            return cardsArr.map(c => `${c.number},${getExpiry(c)},${c.cvv}`).join('\n');
                        case 'sql':
                            return cardsArr.map(c => `INSERT INTO cards(number, month, year, cvv) VALUES ('${c.number}','${(getExpiry(c).split('/')[0]||'').padStart(2,'0')}','${(getExpiry(c).split('/')[1]||'')}','${c.cvv}');`).join('\n');
                        case 'json':
                            return JSON.stringify(cardsArr.map(c => ({ number: c.number, month: (getExpiry(c).split('/')[0]||''), year: (getExpiry(c).split('/')[1]||''), cvv: c.cvv })), null, 2);
                        case 'xml':
                            return cardsArr.map(c => `<card><number>${c.number}</number><month>${(getExpiry(c).split('/')[0]||'')}</month><year>${(getExpiry(c).split('/')[1]||'')}</year><cvv>${c.cvv}</cvv></card>`).join('\n');
                        case 'pipe':
                        default:
                            return cardsArr.map(c => `${c.number}|${getExpiry(c)}|${c.cvv}`).join('\n');
                    }
                };

                // Hide overlay if showing
                if (overlay) overlay.style.display = 'none';
                // Check if the API returned cards and display them
                if (data && data.cards && data.cards.length > 0) {
                    const generatedCards = formatCards(data.cards, format);
                    elements.resultTextarea.value = generatedCards;
                } else {
                    elements.resultTextarea.value = 'No cards were generated. Please check the BIN or API status.';
                }

            } catch (error) {
                // Network or unexpected errors
                const overlay2 = document.getElementById('messageOverlay');
                if (overlay2) { overlay2.textContent = 'Network error. Please check your connection and try again.'; overlay2.style.display = 'flex'; }
                else { elements.resultTextarea.value = 'Network error. Please check your connection and try again.'; }
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
    }

    // Event listener for the "Copy Cards" button
    if (elements.copyButton) {
        console.log('Copy button found and event listener added');
        elements.copyButton.addEventListener('click', () => {
            console.log('Copy button clicked!');
            copy();
        });
    } else {
        console.log('Copy button NOT found!');
    }

    // Event listener for the "Reset" button
    if (elements.resetButton) {
        console.log('Reset button found and event listener added');
        elements.resetButton.addEventListener('click', () => {
            console.log('Reset button clicked!');
            resetForm();
        });
    } else {
        console.log('Reset button NOT found!');
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

// টোস্ট নোটিফিকেশন ফাংশন
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
    const textarea = document.getElementById('result');
    if (!textarea || !textarea.value.trim()) {
        showCopyNotification("Nothing to copy, please generate first.", true);
        return;
    }
    
    const textToCopy = textarea.value;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showCopyNotification("Copy Done! ✓");
                textarea.select();
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showCopyNotification("Failed to copy! Please try again.", true);
            });
    } else {
        try {
            textarea.select();
            document.execCommand('copy');
            showCopyNotification("Copy Done! ✓");
        } catch (err) {
            console.error('Failed to copy: ', err);
            showCopyNotification("Failed to copy! Please try again.", true);
        }
    }
}

function resetForm() {
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
    
    showCopyNotification("Form reset successfully! ✓");
}

// Optimized BIN value copy functionality
document.addEventListener('DOMContentLoaded', () => {
document.querySelectorAll('.bin-dropdown-value').forEach(element => {
    element.addEventListener('click', function() {
        const textToCopy = this.textContent;
            
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy)
                    .then(() => showCopyNotification("Copy Done! ✓"))
                    .catch(() => showCopyNotification("Failed to copy! Please try again.", true));
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
                    showCopyNotification("Copy Done! ✓");
                } catch (err) {
                    showCopyNotification("Failed to copy! Please try again.", true);
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
