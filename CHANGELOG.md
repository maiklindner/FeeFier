# Changelog - FeeFier

All notable changes to this project will be documented in this file.

## [1.8.0] - 2026-03-21

### Added
- **Popup UI Refresh**: Introduced standard tabbed navigation ("News" vs. "Page Feeds") matching the modern suite design.
- **Granular News Control**: Individual news items can now be marked as read via a new checkmark icon.
- **Enhanced Management**: Quick-edit interval input and unsubscribe buttons added directly to the Page Feeds tab.
- **Suite Consistency**: Aligned header styling and empty state branding with TickTab and PagePalette.

### Changed
- **Mark All Icon**: Updated the "Mark All as Read" icon to a double-check (✓✓).

## [1.7.1] - 2026-03-21

### Fixed
- **Badge Priority Logic**: Global unread counts now correctly override tab-specific discovery indicators.
- **URL Normalization**: Discovery filtering now handles trailing slashes and case differences reliably.

## [1.7.0] - 2026-03-21

### Added
- **Feed Discovery Engine**: Automatically scan websites for RSS/Atom feeds via `<link>` tags and direct feed URLs.
- **Discovery Indicators**: Real-time blue `+` badge on the extension icon when new feeds are found.
- **One-Click Subscription**: Basic "Feeds on this page" management in the popup.

## [1.6.2] - 2026-03-20

### Changed
- **Graceful Error Handling**: Replaced loud `console.error` logs with silent `console.warn` for transient external issues (e.g., network timeouts, expired sessions, 403 Forbidden).
- **Internal Status Tracking**: Implemented a background health tracker (`feedStatuses`) in storage to record fetch errors without triggering browser-level "Extension Error" alerts.

## [1.6.1] - 2026-03-18

### Changed
- **Screenshot Refinement**: Centralized and localized demo data in `locales.json` for high-quality screenshots.

## [1.6.0] - 2026-03-18

### Added
- **Intelligent Link Opening**: Links now open in the foreground by default. Background opening is still supported via Ctrl/Cmd key or middle-click.
- **Customizable Link Behavior**: New option "Open links in background" allows you to revert to the old background-only behavior.
- **Full Localization**: Added comprehensive translations for all features in 7 languages (EN, DE, ES, FR, JA, PT, ZH).

### Changed
- **UI Standardization**: Modernized the options page UI with refined "Premium" toggle switches (50x28px with shadow), matching the updated extension suite style.
- **Layout Refinement**: Standardized the settings layout with better spacing and visual hierarchy.

## [1.5.1] - 2026-03-17

### Added
- **Import & Export**: You can now backup and restore your feed configurations via JSON files.
- **Undo Deletion**: Feeds are now removed immediately with a non-blocking "Undo" option, significantly improving the user experience.
- **Unified Notifications**: All status messages (save, error, undo) now use a modern, animated toast notification system.

### Fixed
- **Toast Conflict**: Fixed an issue where auto-save notifications would overwrite the "Undo" deletion toast, ensuring a smoother recovery process.

## [1.5] - 2026-03-17

### Added
- **Drag and Drop Reordering**: You can now reorder your feeds directly on the options page by dragging and dropping the feed rows.
- **Automatic Saving**: The new order is automatically saved as soon as you release the feed at its new position.

## [1.4] - 2026-03-12

### Added
- **Feed Naming**: You can now give your feeds descriptive names to easily identify them in the popup and notifications.

### Changed
- **Layout Refinement**: Optimized the options page layout for better usability, placing the URL field at the top for maximum width.

---

## [1.3] - 2026-03-09

### Added
- **Auto-Focus**: The URL field is now automatically focused when adding a new feed for a faster setup.

### Changed
- **UI Refresh**: Added active row highlighting for better visual feedback during editing.
- **Improved Workflow**: New feeds are now added to the top of the list for better accessibility.

---

## [1.2] - 2026-03-07

### Added
- **Multi-Feed Management**: You can now add and remove multiple feeds directly from the options page.
- **Internationalization**: Added support for multiple languages across the entire extension.

### Changed
- **UI Refresh**: Modernized the options page with a new color palette and a cleaner, more minimalist design.
- **Improved Workflow**: The options page now opens in a full browser tab for better visibility and management.

---

## [1.1] - 2026-03-01

### Added
- Enhanced error messaging for better troubleshooting.
- Updated Privacy Policy and Store Listing documentation.

---

## [1.0] - 2026-03-01

### Added
- Initial release of FeeFier.
- Core RSS/Atom feed processing logic.
- Basic options UI for feed management.
