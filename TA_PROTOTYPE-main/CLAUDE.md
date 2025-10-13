# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monitor Framework 2.0 is a modular real-time monitoring and control framework supporting both web and desktop deployment. Built with React frontend and Node.js backend, featuring WebSocket real-time communication, flexible database support (MySQL/Firebase), and a clean modular architecture.

## Architecture

### Core Design Pattern

The framework uses a **modular singleton architecture** where each module has a single responsibility:

- **main.js** (Electron entry): Orchestrates all modules in desktop mode
- **server.js** (Standalone server): Orchestrates modules without Electron GUI
- All modules are initialized sequentially with proper dependency injection

### Dual Deployment Modes

1. **Electron Desktop App** (`npm run start:electron`):
   - Uses `main.js` as entry point
   - Includes WindowManager for GUI
   - Full IPC communication between main and renderer processes

2. **Standalone Web Server** (`npm start` or `npm run dev:backend`):
   - Uses `server.js` as entry point
   - No WindowManager or IPC handlers
   - Modules receive `null` for mainWindow parameter

### Module Dependencies

```
DatabaseManager (initialized first)
    ↓
┌───────────┬────────────────┬─────────────────┐
WindowManager  APIServer      SerialManager    WebsocketManager
   (Electron    (needs DB)    (needs DB,       (needs DB,
    only)                     optional window) optional window)
    ↓
IPCManager
(needs DB + SerialManager, Electron only)
```

**Critical**: Database must be initialized before any other module.

## Common Commands

### Development
```bash
npm run dev              # Start both backend + React frontend (hot reload)
npm run dev:backend      # Backend only (nodemon with hot reload)
npm run dev:frontend     # React frontend only
npm run dev:electron     # Electron in development mode
```

### Production
```bash
npm start                # Backend server only (production)
npm run start:electron   # Electron desktop app
```

### Building
```bash
npm run build            # Build frontend + backend
npm run build:frontend   # Build React app only
npm run build:electron   # Package Electron app
```

### Database
```bash
npm run switch-db mysql          # Switch to MySQL
npm run switch-db firebase       # Switch to Firebase/Firestore
npm run switch-db cosmosdb       # Switch to Azure Cosmos DB (MongoDB API)
npm run switch-db hybrid         # MySQL + Firebase (MySQL primary)
npm run switch-db hybrid-cosmos  # MySQL + Cosmos DB (MySQL primary)
```

### Code Quality
```bash
npm run lint          # Lint all code
npm run lint:fix      # Auto-fix linting issues
npm test              # Run React tests
npm run test:backend  # Run backend tests (Jest)
```

## Database Architecture

### DatabaseAdapter Pattern

Located in `lib/db/databaseAdapter.js`, this is the **universal database interface** supporting:

- **MySQL mode**: Uses `mysqlDB.js` with query builder
- **Firestore mode**: Uses `firebaseDB.js` (Firestore or Realtime)
- **Cosmos DB mode**: Uses `cosmosDB.js` (Azure Cosmos DB with MongoDB API)
- **Hybrid mode**: MySQL as primary, Firebase as secondary with auto-sync
- **Hybrid-Cosmos mode**: MySQL as primary, Cosmos DB as secondary with auto-sync

**Key Methods**:
- `postData(tableName, data)` - Insert records
- `getDataByFilters(tableName, filters, options)` - Query with filters
- `updateData(tableName, data, whereClause, whereParams)` - Update records
- `deleteData(tableName, whereClause, whereParams)` - Delete records
- `table(name)` - Query builder (MySQL only)
- `query(sql, params)` - Raw SQL (MySQL only)
- `subscribe(tableName, callback, filters)` - Real-time subscriptions (Firebase only)

**Important**: The adapter is a singleton. Access via:
```javascript
const { getInstance } = require('./lib/db/databaseAdapter');
const db = getInstance();
```

### Database Configuration

Set via `DB_TYPE` environment variable:
- `mysql` - MySQL only
- `firestore` - Firebase/Firestore only
- `cosmosdb` - Azure Cosmos DB only (MongoDB API)
- `hybrid` - MySQL + Firebase (MySQL primary, Firebase secondary with auto-sync)
- `hybrid-cosmos` - MySQL + Cosmos DB (MySQL primary, Cosmos DB secondary with auto-sync)

## Module System

### Module Structure

Each module in `modules/` follows this pattern:
1. Receives dependencies via constructor (database, mainWindow)
2. Has `initialize()` for async setup
3. Has lifecycle methods (`close()`, `stop()`, etc.)
4. Exports a class (not singleton)

### Adding New Modules

1. Create module in `modules/{name}/{name}Manager.js`
2. Follow the constructor pattern: `constructor(database, mainWindow)`
3. Implement `initialize()` and cleanup methods
4. Import and initialize in `main.js` AND `server.js`
5. Respect initialization order (database first!)

### Module Communication

- **Electron mode**: Use IPC via `ipcManager.js`
- **Web mode**: Use WebSocket via `websocketManager.js`
- **Both**: Use database as shared state

## Serial Communication

### Configuration

Serial communication is auto-detecting but can be manually configured:

```env
SERIAL_PORT=COM3              # Windows: COM3, Linux: /dev/ttyUSB0
SERIAL_BAUDRATE=9600
SERIAL_DATA_TYPE=json-object  # json-object, json-array, csv, raw
SERIAL_DB_TABLE_NAME=sensors_table
```

### Auto-Detection

SerialCommunicator (`lib/com/serialCommunicator.js`) automatically:
- Scans available ports
- Attempts connection with priority order
- Implements reconnection logic
- Supports dynamic port switching

### Data Types

- `json-object`: `{"temp": 25, "humidity": 60}`
- `json-array`: `[25, 60, 80]`
- `csv`: `25,60,80`
- `raw`: Raw string data

## WebSocket System

### Architecture

- Uses `socket.io` for bidirectional communication
- Supports room-based broadcasting
- Built-in authentication and heartbeat
- Auto-reconnection on client side

### Configuration

```env
WEBSOCKET_PORT=8080
WEBSOCKET_ENABLE_AUTH=false
WEBSOCKET_HEARTBEAT_INTERVAL=30000
WEBSOCKET_MAX_CONNECTIONS=10
```

### Key Methods

In `websocketManager.js`:
- `broadcastToAll(message)` - Broadcast to all clients
- `broadcastToRoom(roomId, message)` - Broadcast to specific room
- `getStatus()` - Get connection status

## Frontend Integration

### React App Structure

- Located in `frontend/src/`
- Entry: `frontend/src/index.js`
- Main component: `frontend/src/App.js`
- Uses Material-UI components

### Connecting to Backend

**Development**:
- Backend API: `http://localhost:3001`
- WebSocket: `ws://localhost:8080`
- React dev server: `http://localhost:3000` (auto-proxy)

**Production (Electron)**:
- Uses IPC instead of HTTP
- Backend embedded in Electron main process

### Important Files

- `preload.js`: Electron security bridge (exposes safe IPC to renderer)
- `frontend/public/index.html`: HTML entry point

## Alert System

Colored console logging system in `lib/alert/`:

```javascript
const alert = require('./lib/alert');

alert.success('MODULE', 'Operation successful');
alert.error('MODULE', 'Error occurred', error);
alert.info('MODULE', 'Information message');
alert.warning('MODULE', 'Warning message');
alert.system.startup('Application starting');
alert.system.shutdown('Application shutting down');
alert.system.ready('Module ready');
```

## Environment Configuration

### Critical Variables

```env
# Deployment mode
NODE_ENV=development|production
ELECTRON_ENV=false|true

# Database (choose one)
DB_TYPE=mysql|firestore|cosmosdb|hybrid|hybrid-cosmos

# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=monitor_framework_db

# Firebase (if using)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_KEY_FILE=path/to/service-account.json

# Azure Cosmos DB (if using)
COSMOS_CONNECTION_STRING=mongodb://...
COSMOS_ACCOUNT_NAME=your-account
COSMOS_ACCOUNT_KEY=your-key
COSMOS_DATABASE=monitor_db

# Security
JWT_SECRET=your-secret-key
DB_ENCRYPTION_KEY=your-encryption-key
```

### Switching Configurations

Use the database switching script:
```bash
npm run switch-db mysql          # Updates .env to use MySQL
npm run switch-db firebase       # Updates .env to use Firebase
npm run switch-db cosmosdb       # Updates .env to use Azure Cosmos DB
npm run switch-db hybrid         # Updates .env to use MySQL + Firebase
npm run switch-db hybrid-cosmos  # Updates .env to use MySQL + Cosmos DB
```

## Library Documentation

All comprehensive documentation is in `lib/doc/`:

### Database Documentation
- `lib/doc/DATABASE_DOCUMENTATION.md` - Database operations, query builder, encryption
- `lib/doc/FIREBASE_DOCUMENTATION.md` - Firebase/Firestore integration
- `lib/doc/AZURE_INTEGRATION.md` - Azure Cosmos DB complete integration guide
- `lib/doc/AZURE_QUICK_START.md` - Azure Cosmos DB quick 3-step setup
- `lib/doc/COSMOS_DB_REFERENCE.md` - Azure Cosmos DB quick reference card
- `lib/doc/INTEGRATION_SUMMARY.md` - Full module integration explanation
- `lib/doc/ARCHITECTURE_DIAGRAM.md` - Visual architecture diagrams

### Communication Documentation
- `lib/doc/SERIAL_DOCUMENTATION.md` - Hardware communication, troubleshooting
- `lib/doc/WEBSOCKET_DOCUMENTATION.md` - Real-time communication setup

**Always check these docs** when working with the respective libraries.

## Testing Strategy

### Current Setup

- **Frontend**: React Testing Library (`react-scripts test`)
- **Backend**: Jest (`npm run test:backend`)
- Linting: ESLint for all JS files

### Running Tests

```bash
npm test              # React tests (interactive)
npm run test:watch    # React tests (watch mode)
npm run test:backend  # Backend Jest tests
```

## Common Gotchas

1. **Module Initialization Order**: Database MUST be initialized first, or other modules will fail
2. **Electron vs Server Mode**: Check if `mainWindow` is null before using IPC methods
3. **Database Adapter Singleton**: Always use `getInstance()`, never instantiate directly
4. **Serial Port Permissions**: Linux requires user in `dialout` group
5. **Firebase Credentials**: Ensure service account JSON is accessible and path is correct
6. **WebSocket CORS**: Configure `WS_CORS_ORIGIN` in production environments
7. **Build Output**: Frontend builds to `frontend/build/`, Electron packages to `frontend/dist-electron/`

## File Structure Key Points

- `modules/` - Core framework modules (managers)
- `lib/` - Reusable libraries (db, com, alert)
- `App/Http/Controllers/` - HTTP route controllers
- `frontend/src/` - React application
- `frontend/public/` - Static web assets
- `resource/view/` - Legacy frontend (being phased out)
- `scripts/` - Utility scripts (db switching, migrations)

## Debugging Tips

1. **Serial issues**: Check `lib/doc/SERIAL_DOCUMENTATION.md` troubleshooting section
2. **Database errors**: Verify `.env` config and check adapter mode with `npm run switch-db`
3. **WebSocket disconnects**: Check firewall and `WEBSOCKET_HEARTBEAT_INTERVAL`
4. **Electron blank screen**: Check console in DevTools (Ctrl+Shift+I), likely IPC or preload issue
5. **Module not starting**: Check initialization order in `main.js` or `server.js`