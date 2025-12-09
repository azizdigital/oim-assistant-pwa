# OIM Assistant - Offshore Operations Management System

![Version](https://img.shields.io/badge/version-5.1-blue.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Complete Progressive Web App (PWA) for Offshore Installation Managers to manage daily operations, reporting, and performance tracking.

## 🚀 Features

### Core Functionality
- **Daily Operations Report** - Comprehensive reporting system
- **Performance Tracking** - Champion deck and metrics
- **Vessel Management** - Track vessels and activities
- **Hitch Planning** - 28-day cycle management
- **Safety Tracking** - Incidents, near-misses, UAUC reports
- **Wells Management** - Multi-platform well status tracking

### PWA Features
- ✅ **Offline Capable** - Works without internet connection
- ✅ **Install to Home Screen** - Native app experience
- ✅ **Apple Pencil Support** - Handwritten notes on iPad/iPhone
- ✅ **Auto-sync** - Data syncs when back online
- ✅ **Export/Import** - JSON and Excel export
- ✅ **Responsive Design** - Works on all devices

### Handwriting Features
- ✍️ Handwrite notes with Apple Pencil
- 🎨 Multiple colors (Black, Blue, Red, Green)
- 📏 Adjustable pen sizes (Fine, Medium, Thick)
- 💾 Save and attach to reports
- ↩️ Undo and clear functions

## 📱 Installation

### For iPhone/iPad Users:
1. Visit the app URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install

### For Android Users:
1. Visit the app URL in Chrome
2. Tap the menu (three dots)
3. Tap "Install app" or "Add to Home Screen"

### For Desktop:
1. Visit the app URL in Chrome or Edge
2. Click the install icon in the address bar
3. Click "Install"

## 🛠️ Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage + IndexedDB
- **PWA**: Service Worker, Web Manifest
- **Libraries**:
  - SheetJS (XLSX) - Excel export
  - PapaParse - CSV handling
  - Signature Pad - Handwriting support

## 📁 File Structure

```
oim-assist-pwa/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── app.js              # Core application logic
├── handwriting.js      # Apple Pencil & handwriting
├── pwa.js              # PWA features & service worker
├── sw.js               # Service worker for offline
├── manifest.json       # PWA manifest
└── icons/              # App icons
    ├── icon-180.png
    ├── icon-192.png
    └── icon-512.png
```

## 🎯 Usage

### Creating a Daily Report
1. Navigate to "Daily Report" tab
2. Fill in Basic Info (Date, Platform, POB)
3. Complete Operations sections
4. Use handwriting for notes if desired
5. Export as JSON or Excel

### Using Handwriting
1. Click the "✍️ Handwrite" button on any text field
2. Draw or write with Apple Pencil or finger
3. Choose colors and pen size
4. Save when done
5. Switch back to "Type" mode to see as text

### Performance Tracking
1. Go to "Performance" tab
2. Import CSV/Excel data
3. View champion deck
4. Track metrics and goals

## 💾 Data Management

### Export Data
- **JSON Export**: Full data backup
- **Excel Export**: Formatted reports
- **CSV Export**: Individual sections

### Import Data
- Drag and drop CSV files
- Performance Champion data import
- JSON restore functionality

## 🔧 Development

### Local Development
```bash
# Clone repository
git clone https://github.com/yourusername/oim-assist-pwa.git

# Serve locally (any HTTP server)
python3 -m http.server 8000
# or
npx serve

# Open browser
open http://localhost:8000
```

### GitHub Pages Deployment
1. Push to GitHub repository
2. Go to Settings > Pages
3. Select branch: `main`
4. Folder: `/ (root)`
5. Save

Your app will be available at: `https://yourusername.github.io/oim-assist-pwa/`

## 📊 Browser Support

| Browser | Support | PWA Install | Offline | Handwriting |
|---------|---------|-------------|---------|-------------|
| iOS Safari 14+ | ✅ | ✅ | ✅ | ✅ |
| Chrome 90+ | ✅ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ | ✅ |
| Firefox 90+ | ✅ | ⚠️ | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | ✅ | ✅ |

## 🐛 Known Issues

- Firefox doesn't support PWA installation on desktop (workaround: use as web app)
- iOS Safari requires manual "Add to Home Screen" (no automatic install prompt)
- Handwriting works best with stylus/Apple Pencil

## 🔐 Security & Privacy

- All data stored locally on device
- No external servers or data transmission
- Export functionality for backup
- No tracking or analytics

## 📝 Version History

### v5.1 (Current)
- PWA conversion with offline support
- Apple Pencil handwriting integration
- GitHub Pages deployment ready
- Enhanced iOS/iPad support

### v5.0
- Original single-file HTML application
- Complete operations management
- LocalStorage data persistence

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License - feel free to use and modify

## 👨‍💻 Author

**Aziz - PETRONAS Personal Development Division**

For offshore operations management in Malaysia's oil and gas sector.

## 📞 Support

For issues or questions:
- Open GitHub issue
- Check documentation
- Review code comments

## 🙏 Acknowledgments

- PETRONAS offshore operations team
- SignaturePad.js for handwriting
- SheetJS for Excel export
- Community contributors

---

**Made with ⚙️ for offshore professionals**
