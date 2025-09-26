# ELITE CC GEN

> Fast, ad‑free BIN‑based card generator with dark UI and mobile‑first design.

[![Live Demo](https://img.shields.io/badge/live-demo-brightgreen.svg)](https://elitegen.pages.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![No Ads](https://img.shields.io/badge/ads-none-green.svg)](#)
[![Dark Theme](https://img.shields.io/badge/theme-dark-000000.svg)](#)

## ✨ Features

- **🚀 Fast Generation** — Quick BIN-based card data generation
- **📱 Mobile-First** — Responsive design that works on all devices
- **🌙 Dark Theme** — Easy on the eyes with modern dark UI
- **🚫 No Ads** — Clean, distraction-free interface
- **📋 Multiple Formats** — PIPE, CSV, JSON, XML, SQL output
- **💾 Smart Memory** — Remembers your recent BINs
- **🔒 Privacy-First** — No tracking, no logs, no data storage
- **🎯 Smart BIN Detection** — Auto-detects card type and CVC length
- **📝 Auto-Formatting** — BIN input with visual card number formatting
- **⚡ Real-time Validation** — Instant feedback and error handling

## 🎯 Quick Start

**🌐 [Try Live Demo](https://elitegen.pages.dev)**

1. **Enter BIN** — Input 6+ digits (auto-formats to look like card number)
2. **Choose Options** — Select quantity, format, and date preferences
3. **Generate** — Click generate to create test data with correct CVC length
4. **Copy** — One-click copy to clipboard

## 📋 Supported Formats

| Format | Example Output |
|--------|----------------|
| **PIPE** | `4532123456789012\|12\|2027\|123` |
| **CSV** | `4532123456789012,12,2027,123` |
| **JSON** | `{"number":"4532123456789012","month":"12","year":"2027","cvv":"123"}` |
| **XML** | `<card><number>4532123456789012</number><month>12</month><year>2027</year><cvv>123</cvv></card>` |
| **SQL** | `INSERT INTO cards(number, month, year, cvv) VALUES ('4532123456789012','12','27','123');` |

## 🎯 Smart BIN Detection

### **Automatic CVC Length Detection:**
- **4-Digit CVC Cards:**
  - American Express: `34xxxx`, `37xxxx`
  - Diners Club: `300xxx-305xxx`, `36xxxx`, `38xxxx`
  - JCB: `35xxxx`

- **3-Digit CVC Cards:**
  - Visa: `4xxxxx`
  - Mastercard: `51xxxx-55xxxx`, `2221xx-2720xx`
  - Discover: `6011xx`, `622126-622925`, `624000-626999`, `628200-628899`, `65xxxx`

### **BIN Auto-Formatting:**
- **Input**: `515462` → **Display**: `515462xxxxxxxxxx`
- **Input**: `5154621234` → **Display**: `5154621234xxxxxxxx`
- **Input**: `3412345678` → **Display**: `3412345678xxxxxxxx`

### **Real-time Feedback:**
- Card type detection as you type
- CVC length indication in placeholder
- Visual card number formatting

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Font Awesome 6.4.2
- **Fonts**: Google Fonts (Nunito, Pacifico)

## 📱 Responsive Design

- **Desktop**: Two-panel layout with side-by-side generation and results
- **Tablet**: Stacked layout with optimized spacing
- **Mobile**: Single-column layout with touch-friendly controls

## 🔧 Configuration

No external configuration required for basic usage. Open `index.html` in a browser.

### Local Storage Keys
- `elite_cc_gen_last_bin` — Last used BIN
- `elite_cc_gen_bin_list` — Recent BIN history (max 20)

### Smart Features
- **BIN History**: Automatically saves and suggests recent BINs
- **CVC Detection**: Auto-detects CVC length based on BIN patterns
- **Card Type Recognition**: Identifies American Express, Visa, Mastercard, etc.
- **Real-time Formatting**: Visual card number formatting as you type

## 📄 Pages

- **Home** (`index.html`) — Main generator interface
- **About** (`about.html`) — Project information, team, terms
- **Contact** (`contact.html`) — Contact information and support

## 🎨 Customization

### Color Scheme
```css
:root {
  --dark-bg: #0f172a;
  --card-bg: #1e293b;
  --input-bg: #334155;
  --accent-teal: #06b6d4;
  --text-primary: #e2e8f0;
}
```

### Font Sizes
- Output textarea: `15.5px` with `1.5` line-height
- Form labels: `12px` uppercase
- Buttons: `13px` medium weight

## 🚀 Deployment

**Live Demo**: [https://elitegen.pages.dev](https://elitegen.pages.dev)

1. **Static Hosting** — Upload files to any static host
2. **CDN** — Use Cloudflare, Netlify, or Vercel
3. **Local Server** — Serve with `python -m http.server` or `npx serve`

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)
- **Bundle Size**: < 50KB (excluding external CDNs)
- **Load Time**: < 2s on 3G
- **Memory Usage**: Minimal (no heavy frameworks)
- **BIN Processing**: Real-time detection and formatting
- **CVC Generation**: Client-side with proper length validation

## 🔒 Privacy & Security

- **No Tracking** — Zero analytics or user tracking
- **No Cookies** — No persistent cookies required
- **Local Storage Only** — BIN history stored locally
- **HTTPS Ready** — Works with SSL certificates
- **CSP Compatible** — Content Security Policy friendly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kamrul** — *Ethical Hacker • Server & System Admin*

- 🌐 Website: [kamrul.com.bd](https://kamrul.com.bd)
- 📧 Email: [engineer@kamrul.com.bd](mailto:engineer@kamrul.com.bd)
- 💬 Telegram: [@elite_supportbd](https://t.me/elite_supportbd)
- 📘 Facebook: [facebook.com/elitekamruls](https://facebook.com/elitekamruls)

## ⚠️ Disclaimer

This tool is for **educational and testing purposes only**. Do not misuse. By using this interface you agree to act responsibly and comply with all applicable laws.

---

<div align="center">

**ELITE CC GEN** — *Fast • Secure • Ad‑free*

*No logs. No tracking. Test data only.*

</div>
