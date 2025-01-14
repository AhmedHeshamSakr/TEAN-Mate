


# TEAN Mate Extension
An AI-powered Extension aimed at improving web accessibility for individuals with disabilities.

## Project Structure
```
extension/
├── manifest.json           # Extension configuration
├── package.json           # Project dependencies
├── webpack.config.js      # Build configuration
├── icons/                 # Extension icons
├── 1-sidebar/            # Sidebar UI components
├── 2-features/           # Feature modules
├── 3-background/         # Background scripts
├── 4-content/            # Content scripts
├── 5-common/             # Shared utilities
└── dist/                 # Build output
```

## Development Guide

### Setting Up Development Environment

1. Install Dependencies
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Start development server
npm run dev
```

2. Load Extension in Edge
- Open Edge and navigate to `edge://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` folder from your project

### Adding New Features

1. **Create Feature Module**
   ```bash
   # Add new feature file in 2-features/
   touch 2-features/NewFeatureHandler.js
   ```
   
   Basic feature template:
   ```javascript
   export class NewFeatureHandler {
     constructor() {
       this.initialize();
     }
     
     initialize() {
       // Setup feature
     }
     
     // Feature methods
   }
   ```

2. **Register in Content Script**
   - Open `4-content/content.js`
   - Import new feature:
     ```javascript
     import { NewFeatureHandler } from '@features/NewFeatureHandler';
     ```
   - Initialize in content script:
     ```javascript
     const newFeature = new NewFeatureHandler();
     ```

3. **Add UI Elements**
   - Add HTML in `1-sidebar/sidebar.html`:
     ```html
     <div id="new-feature-container">
       <!-- Feature UI elements -->
     </div>
     ```
   - Add styles in `1-sidebar/sidebar.css`:
     ```css
     .new-feature-styles {
       /* Feature styles */
     }
     ```
   - Add JavaScript in `1-sidebar/sidebar.js`:
     ```javascript
     import  NewFeatureHandler from '2-features/NewFeatureHandler';
     
     // Feature UI logic
     ```

4. **Add Background Script Handlers (if needed)**
   - Update `3-background/background.js`:
     ```javascript
     // Add message handlers for new feature
     chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
       if (message.type === 'NEW_FEATURE_ACTION') {
         // Handle feature action
       }
     });
     ```

5. **Update Manifest (if needed)**
   - Add new permissions in `manifest.json`:
     ```json
     {
       "permissions": [
         "existing-permission",
         "new-permission"
       ]
     }
     ```

6. **Add Common Utilities (if needed)**
   - Create utility file in `5-common/`:
     ```javascript
     // 5-common/NewUtility.js
     export class NewUtility {
       // Utility methods
     }
     ```

### Building and Testing

1. **Development Build**
```bash
# Start development with watch mode
npm run dev
```

2. **Production Build**
```bash
# Create production build
npm run build
```

3. **Start Dev**
```bash
# Run tests
npm Start
```

### Common Development Tasks

1. **Adding Icons**
   - Place icon in `icons/` directory
   - Update manifest.json if needed
   - Reference in sidebar using webpack alias:
     ```javascript
     import iconPath from '@icons/new-icon.png';
     ```

2. **Adding External Libraries**
   ```bash
   npm install new-library --save
   ```
   - Update webpack.config.js if needed for special handling

3. **Adding Keyboard Shortcuts**
   - Update manifest.json:
     ```json
     {
       "commands": {
         "new-command": {
           "suggested_key": {
             "default": "Ctrl+K"
           },
           "description": "New command description"
         }
       }
     }
     ```

4. **Adding Message Handlers**
   ```javascript
   // In background.js
   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
     // Handle message
   });
   
   // In content.js or feature
   chrome.runtime.sendMessage({
     type: 'MESSAGE_TYPE',
     data: payload
   });
   ```

### Best Practices

1. **Code Organization**
   - Keep features modular and self-contained
   - Use meaningful file and class names
   - Follow the established directory structure

2. **Performance**
   - Lazy load features when possible
   - Minimize DOM operations
   - Use event delegation for multiple listeners

3. **Accessibility**
   - Follow WCAG guidelines
   - Test with screen readers
   - Ensure keyboard navigation works

4. **Error Handling**
   - Implement proper error handling
   - Log errors appropriately
   - Provide user feedback when needed

### Debugging

1. **Extension Debugging**
   - Use `edge://extensions/` debugger
   - Check background script console
   - Monitor network requests

2. **Development Tools**
   - Use source maps for debugging
   - Check webpack build output
   - Monitor console for errors

### Contributing

1. Create a new branch for features
2. Follow coding standards
3. Test thoroughly
4. Submit pull request with description

### Build and Deploy

1. **Development**
   ```bash
   npm run dev
   ```

2. **Production**
   ```bash
   npm run build
   ```

<!-- 3. **Testing**
   ```bash
   npm test
   ``` -->

The `dist` folder will contain the built extension ready for loading into Edge.

## License

## Support
