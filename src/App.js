import React, { useState, useEffect } from 'react';
import './App.css';

// --- CONFIGURATION CONSTANTS ---
const GBPEUR_RATE = 1.18; // 1 GBP = 1.18 EUR
const DKKEUR_RATE = 0.134; // 1 DKK = 0.134 EUR

// --- HOW TO CUSTOMIZE FOR A NEW PARTNER (Replication Manual will have more details) ---
// 1. Update `partnerComplyPay` object below:
//    - `name`: Change "Your PSP Partner" to the actual partner's name (e.g., "Alpha PSP + ComplyPay").
//    - `logo`: Place the partner's logo (e.g., `logo_alpha_psp.png`) in the `public/` folder 
//              of your project and update the path here (e.g., `'./logo_alpha_psp.png'`).
//    - `payinPercentage`, `payinFixed` (EUR), `payoutPercentage`, `walletPrice` (EUR):
//      Adjust these fees if the "Partner + ComplyPay" offering has specific rates for this partner.
//      Remember `payoutFixed` and `platformFee` for `partnerComplyPay` are DYNAMICALLY set (see below).
//      All fixed fees here are base EUR values.
// 2. The main theme color is already set to #2817FF as per branding.
//    The `colors` object within `partnerComplyPay` is used for this main theme.
//
// --- HOW TO CHANGE THE MAIN THEME COLOR ---
// The main theme color is controlled by the `primary` property in the `colors` object 
// for the `partnerComplyPay` entry within the `providerData` constant below.
// To change the theme color for a specific partner version:
// 1. In `App.js` (this file):
//    - Locate the `providerData` constant.
//    - Find the `partnerComplyPay` object (or the specific partner object you are customizing if you've duplicated this template).
//    - Update the `primary` value within its `colors` object. For example: 
//      `colors: { primary: '#NEW_COLOR_HEX_CODE', secondary: '#FFFFFF' }`
//    - The `secondary` color is typically white for contrast on the primary background but can also be adjusted.
// 2. In `App.css`:
//    - The overall page background color is set on the `body` selector:
//      `body { background-color: #2817FF; /* ... */ }`
//      You should update this to match the new `primary` color you set in `App.js` for consistency.
//    - CSS variables are used to apply the theme color to various elements (like card headers, active tabs, etc.).
//      The `--theme-primary` CSS variable is set inline on the main `.App` div in `App.js`:
//      `<div className="App" style={{ '--theme-primary': selectedPspForStyle.colors.primary, ... }}>`
//      This means that changing `providerData.partnerComplyPay.colors.primary` in `App.js` will automatically update
//      most themed elements. However, for the main page background, you need to edit `App.css` as mentioned above.
//    - If you need to change where the theme color is applied, you can modify CSS rules in `App.css` that use `var(--theme-primary)`.
//
// --- HOW TO CHANGE TEXT SIZES ---
// Text sizes are primarily controlled in the `App.css` file.
// To change text sizes for different elements:
// 1. Open `App.css`.
// 2. Look for the CSS selectors corresponding to the elements you want to change.
//    Common elements and their typical selectors include:
//    - Main Page Title (H1 in header): `.App-header h1 { font-size: 1.8em; /* ... */ }`
//    - Header Subtitle (paragraph in header): `.App-header p { font-size: 0.9em; /* ... */ }`
//    - Tab Navigation Buttons: `.tab-navigation button { font-size: 1em; /* ... */ }`
//    - Card Titles (H2): `.card h2 { font-size: 1.4em; /* ... */ }`
//    - Form Labels: `.form-group label { font-size: 0.9em; /* ... */ }`
//    - Form Inputs/Selects: `.form-group input[type="number"], .form-group select { font-size: 1em; /* ... */ }` (and for `input[type="text"]`)
//    - Result Card Titles (H3): `.result-card h3 { font-size: 1.2em; /* ... */ }`
//    - Result Card Text (paragraphs): `.result-card p { font-size: 0.95em; /* ... */ }`
//    - Summary Card Title (H3): `.summary-card h3 { /* ... */ }` (inherits or can be set)
//    - Total Savings Highlight: `.total-savings-highlight { font-size: 1.5em; /* ... */ }`
//    - Footer Text: `.App-footer { font-size: 0.8em; /* ... */ }`
//    - General body text (if not overridden by specific selectors): `body { font-family: ...; }` (font-size can be set here as a base)
// 3. Adjust the `font-size` property for the desired selector. You can use units like `em`, `rem`, `px`, or `%`.
//    - `em`: Relative to the font-size of the parent element.
//    - `rem`: Relative to the font-size of the root element (html).
//    - `px`: Absolute pixels.
// 4. Save `App.css` and refresh the calculator in your browser to see the changes.
// 5. For very specific text elements not covered by general rules, you might need to add a new CSS class to the element
//    in `App.js` (JSX) and then define the `font-size` for that class in `App.css`.
//
// --- IMPORTANT NOTES ON FEES & CURRENCY ---
// - All fixed fees (`payinFixed`, `payoutFixed`, `walletPrice`, `platformFee`) in the `providerData` object
//   for `partnerComplyPay` (as fallbacks), `stripe`, and `mangopay` are assumed to be **base EUR values**.
// - The calculator will automatically convert these EUR fees to the user-selected currency (GBP, DKK)
//   using the `GBPEUR_RATE` and `DKKEUR_RATE` constants before performing calculations.
// - Percentage fees (`payinPercentage`, `payoutPercentage`) are universal and not currency-converted.
// - **Dynamic `payoutFixed` for `partnerComplyPay`**:
//   The `payoutFixed` fee for "Partner & ComplyPay" is determined by the selected "Payout Frequency":
//     - Monthly: 0.00 EUR
//     - Weekly: 0.50 EUR
//     - Daily: 1.00 EUR
//   These EUR values are then converted to the selected display currency.
// - **Dynamic `platformFee` for `partnerComplyPay`**:
//   The `platformFee` for "Partner & ComplyPay" is determined by the GMV/month:
//     - GMV <= 250,000 EUR: 300 EUR
//     - GMV > 250,000 EUR and GMV <= 2,000,000 EUR: 600 EUR
//     - GMV > 2,000,000 EUR: 999 EUR
//   These EUR values are then converted to the selected display currency.
// - **Custom Provider Fees**: Fees entered for the "Custom Provider" in the UI are assumed to be
//   in the currency currently selected by the user in the calculator.
//   Input format for these fields should allow commas for thousands and periods for decimals (e.g., "1,234.56").

const providerData = {
  partnerComplyPay: { 
    name: "Partner & ComplyPay", 
    payinPercentage: 0.005, 
    payinFixed: 0.06,       // EUR 0.10
    payoutPercentage: 0.00, 
    payoutFixed: 0.00,      // EUR 0.00 (fallback, dynamic logic applies as described above)
    walletPrice: 1.0,       // EUR 1.00 per vendor/month
    platformFee: 300,       // EUR (fallback, dynamic logic applies as described above)
    logo: './Vibrant & ComplyPay Logo.png', // Generic logo, update per partner
    colors: {
      primary: '#2817FF', // Main theme color
      secondary: '#FFFFFF', // Used for contrast elements if needed
    }
  },
  stripe: {
    name: "Stripe",
    payinPercentage: 0.015,
    payinFixed: 0.25,       // EUR
    payoutPercentage: 0.0025,
    payoutFixed: 0.10,      // EUR
    walletPrice: 2.0,       // EUR
    platformFee: 0,         // EUR
    logo: './logo_stripe.png',
    colors: { primary: '#6772e5', secondary: '#32325d' } 
  },
  mangopay: {
    name: "Mangopay",
    payinPercentage: 0.014,
    payinFixed: 0.25,       // EUR
    payoutPercentage: 0.000,
    payoutFixed: 0.2,      // EUR
    walletPrice: 0.0,       // EUR
    platformFee: 249,         // EUR
    logo: './logo_mangopay.png',
    colors: { primary: '#ff5400', secondary: '#3c3c3c' } 
  },
};

// Helper function to convert EUR fees to the target currency
function getConvertedFee(feeInEur, targetCurrency) {
  if (targetCurrency === 'GBP') return feeInEur / GBPEUR_RATE;
  if (targetCurrency === 'DKK') return feeInEur / DKKEUR_RATE;
  return feeInEur; // for EUR or if no conversion needed
}

// Helper to parse the custom float format (e.g., "1,234.56" or "1234.56")
const parseFloatCustom = (value) => {
  if (typeof value === 'number') return value; // Already a number
  if (typeof value !== 'string') return 0; // Or handle as an error
  return parseFloat(value.replace(/,/g, '')) || 0;
};

function App() {
  // --- STATES FOR CALCULATOR INPUTS ---
  const [currency, setCurrency] = useState('EUR');
  // Store numeric inputs that allow custom formatting as strings
  const [gmvInput, setGmvInput] = useState('1,000,000.00'); // User's initial value
  const [numPayins, setNumPayins] = useState(10000); // User's initial value
  const [numPayouts, setNumPayouts] = useState(400); // User's initial value
  const [numVendors, setNumVendors] = useState(100); // User's initial value
  const [payoutFrequency, setPayoutFrequency] = useState('weekly'); // User's initial value

  // --- STATES FOR CUSTOM PROVIDER INPUTS (store as strings for custom format) ---
  const [customPayinPercentageInput, setCustomPayinPercentageInput] = useState('1.8'); // User's initial value (e.g. 1.8 for 1.8%)
  const [customPayinFixedInput, setCustomPayinFixedInput] = useState('0.25'); // User's initial value
  const [customPayoutPercentageInput, setCustomPayoutPercentageInput] = useState('0.25'); // User's initial value
  const [customPayoutFixedInput, setCustomPayoutFixedInput] = useState('0.25'); // User's initial value
  const [customWalletPriceInput, setCustomWalletPriceInput] = useState('1.00'); // User's initial value

  const [results, setResults] = useState(null);
  const defaultPspKey = 'partnerComplyPay'; 
  const [selectedPspForStyle, setSelectedPspForStyle] = useState(providerData[defaultPspKey]);
  const [activeView, setActiveView] = useState('defaultComparison'); 

  // --- CALCULATION FUNCTION ---
  const calculateCosts = () => {
    const gmv = parseFloatCustom(gmvInput);
    const parsedNumPayins = parseInt(numPayins, 10) || 0;
    const parsedNumPayouts = parseInt(numPayouts, 10) || 0;
    const parsedNumVendors = parseInt(numVendors, 10) || 0;

    // For custom provider, parse their inputs here
    const customPayinPercentage = parseFloatCustom(customPayinPercentageInput) / 100;
    const customPayinFixed = parseFloatCustom(customPayinFixedInput);
    const customPayoutPercentage = parseFloatCustom(customPayoutPercentageInput) / 100;
    const customPayoutFixed = parseFloatCustom(customPayoutFixedInput);
    const customWalletPrice = parseFloatCustom(customWalletPriceInput);

    const costs = {};
    let providersToCalculate = [defaultPspKey, 'stripe', 'mangopay'];
    if (activeView === 'customComparison') {
      providersToCalculate = [defaultPspKey, 'custom'];
    }
    if (!providersToCalculate.includes(defaultPspKey)){
        providersToCalculate.unshift(defaultPspKey);
    }
    providersToCalculate = [...new Set(providersToCalculate)];

    let gmvInEur = gmv;
    if (currency === 'GBP') gmvInEur = gmv * GBPEUR_RATE;
    if (currency === 'DKK') gmvInEur = gmv * DKKEUR_RATE;

    providersToCalculate.forEach(providerKey => {
      let feePayinPercentage, feePayinFixed, feePayoutPercentage, feePayoutFixed, feeWalletPrice, feePlatform;
      let providerName, providerLogo, providerColors;

      if (providerKey === 'custom') {
        providerName = "Custom Provider";
        feePayinPercentage = customPayinPercentage;
        feePayinFixed = customPayinFixed;       
        feePayoutPercentage = customPayoutPercentage;
        feePayoutFixed = customPayoutFixed;     
        feeWalletPrice = customWalletPrice;     
        feePlatform = 0; 
        providerLogo = './logo_custom_generic.png';
        providerColors = { primary: '#777', secondary: '#ccc' };
      } else {
        const staticData = providerData[providerKey];
        providerName = staticData.name; 
        providerLogo = staticData.logo;
        providerColors = (providerKey === defaultPspKey) ? 
                         providerData[defaultPspKey].colors : 
                         staticData.colors;

        feePayinPercentage = staticData.payinPercentage;
        feePayinFixed = getConvertedFee(staticData.payinFixed, currency);
        feePayoutPercentage = staticData.payoutPercentage;
        feeWalletPrice = getConvertedFee(staticData.walletPrice, currency);
        
        if (providerKey === defaultPspKey) {
          let basePayoutFixedEUR;
          if (payoutFrequency === 'monthly') basePayoutFixedEUR = 0.00;
          else if (payoutFrequency === 'weekly') basePayoutFixedEUR = 0.50;
          else if (payoutFrequency === 'daily') basePayoutFixedEUR = 1.00;
          else basePayoutFixedEUR = staticData.payoutFixed; 
          feePayoutFixed = getConvertedFee(basePayoutFixedEUR, currency);

          let basePlatformFeeEUR;
          if (gmvInEur <= 250000) {
            basePlatformFeeEUR = 300;
          } else if (gmvInEur > 250000 && gmvInEur <= 2000000) {
            basePlatformFeeEUR = 600;
          } else { 
            basePlatformFeeEUR = 999;
          }
          feePlatform = getConvertedFee(basePlatformFeeEUR, currency);
        } else {
          feePayoutFixed = getConvertedFee(staticData.payoutFixed, currency);
          feePlatform = getConvertedFee(staticData.platformFee, currency);
        }
      }

      const payinCost = (gmv * feePayinPercentage) + (parsedNumPayins * feePayinFixed);
      const payoutVolume = gmv * 0.8; 
      const payoutCost = (payoutVolume * feePayoutPercentage) + (parsedNumPayouts * feePayoutFixed);
      const walletCost = parsedNumVendors * feeWalletPrice;
      const totalMonthlyCost = payinCost + payoutCost + walletCost + feePlatform;

      costs[providerKey] = {
        name: providerName,
        totalMonthlyCost: totalMonthlyCost,
        totalYearlyCost: totalMonthlyCost * 12,
        logo: providerLogo,
        colors: providerColors
      };
    });

    if (costs[defaultPspKey]) {
      Object.keys(costs).forEach(key => {
        if (key !== defaultPspKey) {
          costs[key].yearlySavingsWithDefaultPsp = costs[defaultPspKey].totalYearlyCost - costs[key].totalYearlyCost > 0 ? costs[defaultPspKey].totalYearlyCost - costs[key].totalYearlyCost : costs[key].totalYearlyCost - costs[defaultPspKey].totalYearlyCost;
        }
      });
    }
    setResults(costs);
  };

  useEffect(() => {
    const currentDefaultProvider = providerData[defaultPspKey];
    setSelectedPspForStyle({
        ...currentDefaultProvider,
        name: "Partner & ComplyPay", 
        colors: { primary: '#2817FF', secondary: '#FFFFFF' } 
    });
    calculateCosts(); 
  }, [gmvInput, numPayins, numPayouts, numVendors, payoutFrequency, customPayinPercentageInput, customPayinFixedInput, customPayoutPercentageInput, customPayoutFixedInput, customWalletPriceInput, currency, activeView]);

  const formatCurrency = (amount) => {
    let locale = 'en-US'; 
    if (currency === 'EUR') locale = 'de-DE'; // Using German locale for EUR to get comma as decimal separator if that's the standard there
    if (currency === 'GBP') locale = 'en-GB';
    if (currency === 'DKK') locale = 'da-DK';
    
    // Forcing comma for thousands and period for decimal for EUR, GBP, DKK
    const options = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    let formattedAmount = parseFloatCustom(amount);
    if (isNaN(formattedAmount)) {
        formattedAmount = 0;
    }

    // Standard Intl.NumberFormat for most cases
    let numberFormatted = new Intl.NumberFormat(locale, options).format(formattedAmount);

    // Post-processing for EUR, GBP, DKK to ensure specific separators if Intl doesn't match perfectly
    // This is a bit of a workaround if Intl.NumberFormat doesn't give the exact desired output for all locales.
    // For EUR (de-DE usually gives ., as thousands and , as decimal)
    // For GBP (en-GB usually gives , as thousands and . as decimal)
    // For DKK (da-DK usually gives . as thousands and , as decimal)
    // The user wants: COMMA for thousands, PERIOD for decimal for ALL outputs.

    // Let's create a custom formatter to ensure the user's desired format
    const customFormatted = (num) => {
        const parts = num.toFixed(2).toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };
    
    const currencySymbol = new Intl.NumberFormat(locale, { style: 'currency', currency: currency, minimumFractionDigits:0, maximumFractionDigits:0 }).format(0).replace(/[0-9.,\s]/g, '');
    
    return `${currencySymbol}${customFormatted(formattedAmount)}`;
  };


  // Generic handler for text inputs that will be parsed later
  const handleMonetaryInputChange = (setter) => (event) => setter(event.target.value);
  // Handler for integer inputs (can remain type="number" or also use text with parsing)
  const handleIntegerInputChange = (setter) => (event) => setter(parseInt(event.target.value, 10) || 0);


  const renderResults = () => {
    if (!results) return null;
    
    let providersToShow = [];
    if (activeView === 'defaultComparison') {
        providersToShow = [defaultPspKey, 'stripe', 'mangopay'];
    } else if (activeView === 'customComparison') {
        providersToShow = [defaultPspKey, 'custom'];
    }

    return (
        <section className="results-section card">
            <h2>Simulation Results</h2>
            <div className="results-grid">
                {providersToShow.map(key => {
                    if (!results[key]) return null; 
                    return (
                        <div key={key} className="result-card">
                            <div className="result-card-header">
                                <h3>{results[key].name}</h3>
                            </div>
                            <p>Total Annual Cost: {formatCurrency(results[key].totalYearlyCost)}</p>
                            {key !== defaultPspKey && results[defaultPspKey] && (
                                <p className={`savings-text ${results[key].yearlySavingsWithDefaultPsp < 0 ? 'negative-savings' : 'positive-savings'}`}>
                                    Annual Savings with {results[defaultPspKey].name}: {formatCurrency(Math.abs(results[key].yearlySavingsWithDefaultPsp))}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="results-footnote">
                Values are estimates. All fees for Stripe, Mangopay, and Partner & ComplyPay are stored in EUR and converted to {currency} for calculation using rates: 1 GBP = {GBPEUR_RATE} EUR, 1 DKK = {DKKEUR_RATE} EUR. Custom provider fees are entered directly in {currency}.
            </p>
        </section>
    );
};

  const complyPayFooterLogo = './main_horisontal_white.png'; // Update with your actual logo path in public/

  return (
    <div className="App" style={{ 
        '--theme-primary': selectedPspForStyle.colors.primary, 
        '--theme-secondary': selectedPspForStyle.colors.secondary 
    }}>
      <header className="App-header card">
        <div className="header-content">
            <h1>Cost Savings Calculator</h1>
            <p>Estimate your potential savings with Partner & ComplyPay</p>
            <nav className="tab-navigation">
                <button 
                    onClick={() => setActiveView('defaultComparison')} 
                    className={activeView === 'defaultComparison' ? 'active' : ''}
                >
                    Standard Comparison
                </button>
                <button 
                    onClick={() => setActiveView('customComparison')} 
                    className={activeView === 'customComparison' ? 'active' : ''}
                >
                    Compare with Custom
                </button>
            </nav>
        </div>
        <img src={selectedPspForStyle.logo} alt={`${selectedPspForStyle.name} logo`} className="App-logo" />
      </header>

      <main className="App-main">
        <section className="inputs-section card">
          <h2>Operational Data</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="currency">Currency:</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="DKK">DKK (kr)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="gmv">GMV/month:</label>
              <input type="text" id="gmv" value={gmvInput} onChange={handleMonetaryInputChange(setGmvInput)} placeholder="e.g., 1,000,000.00" />
            </div>
            <div className="form-group">
              <label htmlFor="numPayins">Number of Pay-ins/month:</label>
              <input type="number" id="numPayins" value={numPayins} onChange={handleIntegerInputChange(setNumPayins)} placeholder="e.g., 10000" />
            </div>
            <div className="form-group">
              <label htmlFor="numPayouts">Number of Pay-outs/month:</label>
              <input type="number" id="numPayouts" value={numPayouts} onChange={handleIntegerInputChange(setNumPayouts)} placeholder="e.g., 400" />
            </div>
            <div className="form-group">
              <label htmlFor="numVendors">Number of Vendors/Wallets:</label>
              <input type="number" id="numVendors" value={numVendors} onChange={handleIntegerInputChange(setNumVendors)} placeholder="e.g., 100" />
            </div>
            <div className="form-group">
              <label htmlFor="payoutFrequency">Payout Frequency:</label>
              <select id="payoutFrequency" value={payoutFrequency} onChange={(e) => setPayoutFrequency(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>
        </section>

        {activeView === 'customComparison' && (
            <section className="custom-provider-inputs card">
                <h2>Custom Provider Fees</h2>
                <p className="input-format-note">Enter fees in {currency}. Use a period (.) for decimals (e.g., 0.25 for fixed fee, 1.8 for 1.8%).</p>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="customPayinPercentage">Pay-in Fee (% on Volume):</label>
                        <input type="text" id="customPayinPercentage" value={customPayinPercentageInput} onChange={handleMonetaryInputChange(setCustomPayinPercentageInput)} placeholder="e.g., 1.8" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="customPayinFixed">Pay-in Fixed Fee:</label>
                        <input type="text" id="customPayinFixed" value={customPayinFixedInput} onChange={handleMonetaryInputChange(setCustomPayinFixedInput)} placeholder="e.g., 0.25" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="customPayoutPercentage">Pay-out Fee (% on Volume):</label>
                        <input type="text" id="customPayoutPercentage" value={customPayoutPercentageInput} onChange={handleMonetaryInputChange(setCustomPayoutPercentageInput)} placeholder="e.g., 0.25" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="customPayoutFixed">Pay-out Fixed Fee:</label>
                        <input type="text" id="customPayoutFixed" value={customPayoutFixedInput} onChange={handleMonetaryInputChange(setCustomPayoutFixedInput)} placeholder="e.g., 0.25" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="customWalletPrice">Price per Vendor (mo):</label>
                        <input type="text" id="customWalletPrice" value={customWalletPriceInput} onChange={handleMonetaryInputChange(setCustomWalletPriceInput)} placeholder="e.g., 1.00" />
                    </div>
                </div>
            </section>
        )}

        {results && renderResults()}
      </main>

      <footer className="App-footer">
        <p>
          Calculator powered by 
          <img src={complyPayFooterLogo} alt="ComplyPay Logo" className="footer-logo" />
        </p>
      </footer>
    </div>
  );
}

export default App;

