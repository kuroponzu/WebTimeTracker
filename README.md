# WebTimeTracker

A Chrome extension that tracks and analyzes your web browsing time by domain.

## Features

- 📊 **Real-time Tracking**: Automatically tracks time spent on each website
- 🎯 **Domain-based Analytics**: See how much time you spend on each domain
- 💾 **Local Storage**: All data is stored locally for privacy
- 📈 **Daily Statistics**: View your browsing patterns for each day
- 🚫 **Exclude Domains**: Option to exclude specific domains from tracking
- 📥 **Export Data**: Export your data in JSON or CSV format
- 🎨 **Beautiful UI**: Modern, gradient-based design with dark mode support

## Installation

### From Source

1. Clone this repository or download the source code
```bash
git clone https://github.com/yourusername/WebTimeTracker.git
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the WebTimeTracker directory

5. The extension icon should appear in your Chrome toolbar

## Usage

### Basic Usage

1. Click on the WebTimeTracker icon in your Chrome toolbar
2. The popup will show:
   - Current session time for the active tab
   - Today's total browsing time
   - Top domains you've visited today

### Settings

Click the "Settings" button in the popup to:
- Add domains to exclude from tracking
- Export your tracking data
- Clear data (today's or all)
- View overall statistics

### Data Export

You can export your data in two formats:
- **JSON**: Complete data with all session details
- **CSV**: Simplified format for spreadsheet analysis

## Privacy

WebTimeTracker respects your privacy:
- ✅ All data is stored locally on your device
- ✅ No data is sent to external servers
- ✅ No user tracking or analytics
- ✅ Open source code for transparency

## How It Works

The extension uses:
- **Background Service Worker**: Monitors tab changes and tracks active time
- **Content Scripts**: Detects page visibility changes
- **Chrome Storage API**: Stores data locally
- **Chrome Alarms API**: Periodically saves tracking data

## Data Structure

Data is organized by date, with each domain containing:
- Total time spent (in milliseconds)
- Individual session records with start/end times

## Development

### Project Structure
```
WebTimeTracker/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for tracking
├── content.js            # Content script for page visibility
├── popup.html/js/css     # Popup interface
├── options.html/js/css   # Settings page
├── icons/                # Extension icons
└── README.md            # This file
```

### Building from Source

No build process is required. The extension runs directly from the source files.

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### Extension not tracking time
- Make sure the extension has necessary permissions
- Check if the domain is in the excluded list
- Restart Chrome if needed

### Data not persisting
- Check Chrome's storage quota
- Ensure Chrome has write permissions

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Changelog

### Version 1.0.0
- Initial release
- Basic time tracking functionality
- Popup interface with current session and daily stats
- Settings page with data export and domain exclusion
- Beautiful gradient UI design

## Future Enhancements

- 📊 Charts and visualizations
- 📅 Weekly/monthly reports
- 🏷️ Website categorization
- ⏰ Time limits and notifications
- 🔄 Sync across devices (optional)
- 🌍 Multiple language support

---

Made with ❤️ for productivity enthusiasts