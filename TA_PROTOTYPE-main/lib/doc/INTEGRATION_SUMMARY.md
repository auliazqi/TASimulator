# Azure Cosmos DB - Full Integration Summary

## ✅ Complete Module Integration

Azure Cosmos DB is now **fully integrated** into your Monitor Framework's module system!

## Architecture Overview

### Integration Flow

```
main.js / server.js
    ↓
DatabaseManager (modules/database/databaseManager.js)
    ↓ [reads DB_TYPE from .env]
    ↓
DatabaseAdapter (lib/db/databaseAdapter.js)
    ↓ [singleton pattern]
    ↓
┌─────────────┬──────────────────┬────────────────┐
│             │                  │                │
mysqlDB.js   firebaseDB.js   cosmosDB.js
(MySQL)      (Firestore)     (Cosmos/MongoDB)
```

### How It Works

1. **DatabaseManager** (Module in `modules/database/`)
   - Reads `DB_TYPE` from environment
   - Initializes the DatabaseAdapter
   - Provides database instance to other modules

2. **DatabaseAdapter** (Library in `lib/db/`)
   - Singleton pattern for unified access
   - Supports: `mysql`, `firestore`, `cosmosdb`, `hybrid`, `hybrid-cosmos`
   - Handles primary/secondary database sync

3. **CosmosDB Driver** (Library in `lib/db/`)
   - MongoDB API implementation
   - Collection-based structure
   - Same interface as Firebase

## Module Files Updated

### ✅ Core Modules
- **`modules/database/databaseManager.js`** - Now detects Cosmos DB via `DB_TYPE`
- **`main.js`** - Uses DatabaseManager (already working)
- **`server.js`** - Uses DatabaseManager (already working)

### ✅ Database Libraries
- **`lib/db/cosmosDB.js`** - NEW! Cosmos DB adapter
- **`lib/db/databaseAdapter.js`** - Updated to support Cosmos DB
- **`lib/db/mysqlDB.js`** - Existing (unchanged)
- **`lib/db/firebaseDB.js`** - Existing (unchanged)

### ✅ Configuration & Scripts
- **`scripts/switch-db.js`** - Updated to support Cosmos DB switching
- **`.env.example`** - Added Cosmos DB config
- **`package.json`** - Added `@azure/cosmos` and `mongodb` packages

### ✅ Documentation
- **`AZURE_INTEGRATION.md`** - Complete integration guide
- **`AZURE_QUICK_START.md`** - Quick start guide
- **`CLAUDE.md`** - Updated with Cosmos DB info

## How DatabaseManager Initializes

```javascript
// modules/database/databaseManager.js (simplified flow)

class DatabaseManager {
    constructor() {
        this.dbType = process.env.DB_TYPE || 'mysql';
    }

    async initialize() {
        // Supported types automatically use DatabaseAdapter
        const supportedTypes = ['mysql', 'firestore', 'cosmosdb', 'hybrid', 'hybrid-cosmos'];

        if (supportedTypes.includes(this.dbType)) {
            // Use enhanced adapter
            this.dbAdapter = getDatabaseAdapter(); // Singleton
            await this.dbAdapter.initialize();
            this.db = this.dbAdapter;
        }
    }

    getDatabase() {
        return this.db; // Returns DatabaseAdapter instance
    }
}
```

## Usage in Your Application

### Step 1: Set Environment Variable

```env
DB_TYPE=cosmosdb
COSMOS_CONNECTION_STRING=mongodb://...
COSMOS_DATABASE=monitor_db
```

### Step 2: Switch Database (Optional)

```bash
npm run switch-db cosmosdb
```

This updates your `.env` file automatically.

### Step 3: Start Application

```bash
npm start              # Backend server
# or
npm run start:electron # Desktop app
```

### Step 4: Database is Automatically Initialized

```javascript
// In main.js or server.js (already implemented)
const DatabaseManager = require('./modules/database/databaseManager');

const databaseManager = new DatabaseManager();
await databaseManager.initialize(); // Detects DB_TYPE and connects

const db = databaseManager.getDatabase(); // Get database instance

// Use it!
await db.postData('sensors', { temp: 25 });
```

## All Other Modules Work Automatically

Since DatabaseManager provides the `db` instance to all other modules, they work without changes:

### SerialManager
```javascript
// modules/serial/serialManager.js
class SerialManager {
    constructor(database, mainWindow) {
        this.database = database; // Gets DatabaseAdapter instance
    }
}
```

### WebsocketManager
```javascript
// modules/websocket/websocketManager.js
class WebsocketManager {
    constructor(database, mainWindow) {
        this.database = database; // Gets DatabaseAdapter instance
    }
}
```

### APIServer
```javascript
// modules/api/apiServer.js
class APIServer {
    constructor(database) {
        this.database = database; // Gets DatabaseAdapter instance
    }
}
```

**All modules receive the same unified database interface!**

## Database Type Detection

The system automatically detects the database type:

```javascript
// Check what database is being used
const dbManager = new DatabaseManager();
await dbManager.initialize();

console.log(dbManager.isCosmos());  // true if cosmosdb or hybrid-cosmos
console.log(dbManager.isFirebase()); // true if firestore or firebase
console.log(dbManager.isMySQL());    // true if mysql, hybrid, or hybrid-cosmos
console.log(dbManager.isHybrid());   // true if hybrid or hybrid-cosmos

// Get detailed info
const info = dbManager.getDatabaseInfo();
// Returns: { type: 'cosmosdb', primaryDatabase: 'CosmosDB', ... }
```

## Available Database Configurations

| DB_TYPE | Primary Database | Secondary Database | Use Case |
|---------|------------------|-------------------|----------|
| `mysql` | MySQL | None | Traditional SQL |
| `firestore` | Firebase/Firestore | None | Google Cloud NoSQL |
| `cosmosdb` | Azure Cosmos DB | None | Azure NoSQL |
| `hybrid` | MySQL | Firebase (auto-sync) | MySQL + Firebase backup |
| `hybrid-cosmos` | MySQL | Cosmos DB (auto-sync) | MySQL + Azure backup |

## Environment Variables Reference

### MySQL Configuration
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=monitor_db
```

### Firebase Configuration
```env
DB_TYPE=firestore
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/key.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
USE_FIRESTORE=true
```

### Cosmos DB Configuration
```env
DB_TYPE=cosmosdb
COSMOS_CONNECTION_STRING=mongodb://account:key@account.mongo.cosmos.azure.com:10255/?ssl=true
# OR
COSMOS_ACCOUNT_NAME=your-account
COSMOS_ACCOUNT_KEY=your-key
COSMOS_DATABASE=monitor_db
```

### Hybrid Cosmos Configuration
```env
DB_TYPE=hybrid-cosmos

# MySQL (Primary)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=monitor_db

# Cosmos DB (Secondary - auto-sync)
COSMOS_CONNECTION_STRING=mongodb://...
COSMOS_DATABASE=monitor_db
```

## Testing the Integration

### Test 1: Check Initialization

```bash
# Set Cosmos DB
npm run switch-db cosmosdb

# Start server
npm start
```

**Expected output:**
```
🗄️ Initializing Database Adapter (cosmosdb mode)...
✅ Azure Cosmos DB connected
🎯 Database adapter initialized successfully
✅ cosmosdb mode initialized successfully
```

### Test 2: Use Database API

```javascript
const { DatabaseManager } = require('./modules/database/databaseManager');

const manager = new DatabaseManager();
await manager.initialize();

const db = manager.getDatabase();

// Insert data
const result = await db.postData('test', {
    message: 'Hello from Cosmos DB!',
    timestamp: new Date()
});

console.log('Inserted:', result);

// Query data
const data = await db.getDataByFilters('test', {}, { limit: 10 });
console.log('Data:', data);
```

### Test 3: Real-time Subscription

```javascript
// Subscribe to changes
const unsubscribe = await db.subscribe('test', (change) => {
    console.log('Change detected:', change.type);
    console.log('Data:', change.data);
});

// Cleanup
// unsubscribe();
```

## Benefits of This Integration

### ✅ Zero Code Changes
- Existing modules work without modification
- Same database API for all types
- Transparent switching between databases

### ✅ Modular Design
- DatabaseManager in modules directory (follows pattern)
- DatabaseAdapter in lib directory (reusable)
- Clean separation of concerns

### ✅ Collection-based for Firebase/Cosmos
- Both use document/collection model
- Same query builder interface
- Real-time subscriptions support

### ✅ Hybrid Mode Support
- Use MySQL for relational queries
- Sync to Cosmos DB for global distribution
- Automatic failover and backup

### ✅ Production Ready
- Encryption support (same as MySQL/Firebase)
- Connection pooling
- Error handling
- Health checks

## Troubleshooting

### "Cannot find module '@azure/cosmos'"

**Solution:**
```bash
npm install
```

The package is already in package.json, just install dependencies.

### "Database initialization failed"

**Check:**
1. `.env` file has correct `DB_TYPE`
2. Connection string is valid
3. Cosmos DB account is accessible
4. Firewall rules allow your IP

**Debug:**
```javascript
const info = databaseManager.getDatabaseInfo();
console.log('DB Config:', info);
```

### "Change streams not working"

**Requirements:**
- Cosmos DB must be provisioned throughput (not serverless)
- Collection must have at least one document
- MongoDB version 4.0+ compatibility

## Migration Path

### From MySQL to Cosmos DB

1. Export MySQL data:
```javascript
const mysqlDb = new Database(mysqlConfig);
const data = await mysqlDb.table('sensors').get();
```

2. Switch to Cosmos DB:
```bash
npm run switch-db cosmosdb
```

3. Import data:
```javascript
const cosmosDb = manager.getDatabase();
for (const record of data) {
    await cosmosDb.postData('sensors', record);
}
```

### From Firebase to Cosmos DB

Same process - use `firestore` then switch to `cosmosdb`.

## Next Steps

1. ✅ **Integration is complete** - No additional setup needed in modules
2. 📝 **Configure `.env`** - Add your Cosmos DB credentials
3. 🔄 **Switch database** - Run `npm run switch-db cosmosdb`
4. 🚀 **Start app** - Run `npm start` or `npm run start:electron`
5. 🧪 **Test queries** - Use existing database API

**Everything is already wired up and ready to use!** 🎉

## Summary

✅ **Cosmos DB is integrated at the module level** through DatabaseManager
✅ **All other modules work automatically** via dependency injection
✅ **Same API as Firebase** - collection-based, query builder, subscriptions
✅ **No code changes needed** - just set `DB_TYPE=cosmosdb`
✅ **Production ready** - encryption, error handling, health checks

Your modular architecture made this integration seamless! 🚀
