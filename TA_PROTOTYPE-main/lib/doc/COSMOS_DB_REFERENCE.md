# Azure Cosmos DB - Quick Reference Card

## 🚀 Setup in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure .env
```env
DB_TYPE=cosmosdb
COSMOS_CONNECTION_STRING=mongodb://account:key@account.mongo.cosmos.azure.com:10255/?ssl=true
COSMOS_DATABASE=monitor_db
```

### 3. Switch Database (Optional)
```bash
npm run switch-db cosmosdb
```

**Done! Cosmos DB is now integrated.**

---

## 📁 Integration Points

### Module Layer (where it connects)
```
modules/database/databaseManager.js
    ↓ reads DB_TYPE
    ↓ initializes
lib/db/databaseAdapter.js (singleton)
    ↓ creates driver
lib/db/cosmosDB.js (MongoDB API)
```

### How Other Modules Use It
```javascript
// All modules receive db instance via constructor
class SerialManager {
    constructor(database, mainWindow) {
        this.database = database; // ← Cosmos DB instance
    }
}

// Use it anywhere
await this.database.postData('sensors', { temp: 25 });
```

---

## 🔧 Configuration Options

### Cosmos DB Only
```env
DB_TYPE=cosmosdb
COSMOS_CONNECTION_STRING=...
```

### Hybrid: MySQL + Cosmos DB
```env
DB_TYPE=hybrid-cosmos

# MySQL (primary)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=monitor_db

# Cosmos DB (secondary, auto-sync)
COSMOS_CONNECTION_STRING=...
```

---

## 💡 Database API (same for all types)

### Basic Operations
```javascript
const db = databaseManager.getDatabase();

// Insert
await db.postData('sensors', {
    temperature: 25,
    humidity: 60
});

// Query
const data = await db.getDataByFilters('sensors',
    { temperature: { operator: '>', value: 20 } },
    { orderBy: 'timestamp DESC', limit: 10 }
);

// Update
await db.updateData('sensors',
    { status: 'active' },
    'id = ?',
    ['sensor-123']
);

// Delete
await db.deleteData('sensors', 'id = ?', ['sensor-123']);
```

### Query Builder (Collection-based)
```javascript
// Works with Cosmos DB & Firebase
const results = await db.table('sensors')
    .where('temperature', '>', 20)
    .where('status', 'active')
    .orderByDesc('timestamp')
    .limit(10)
    .get();

// Advanced queries
const filtered = await db.table('sensors')
    .whereIn('location', ['warehouse-a', 'warehouse-b'])
    .whereBetween('temperature', 15, 30)
    .orderBy('timestamp', 'ASC')
    .get();

// Single record
const sensor = await db.table('sensors')
    .where('id', 'sensor-123')
    .first();

// Count
const count = await db.table('sensors')
    .where('status', 'active')
    .count();
```

### Real-time Subscriptions
```javascript
// Subscribe to collection changes (Cosmos DB & Firebase)
const unsubscribe = await db.subscribe('sensors', (change) => {
    console.log('Type:', change.type); // 'insert', 'update', 'delete'
    console.log('ID:', change.id);
    console.log('Data:', change.data);
});

// Unsubscribe
unsubscribe();
```

---

## 🎯 Database Type Detection

```javascript
const dbManager = new DatabaseManager();
await dbManager.initialize();

// Check database type
dbManager.isCosmos();    // true if cosmosdb or hybrid-cosmos
dbManager.isFirebase();  // true if firestore or firebase
dbManager.isMySQL();     // true if mysql, hybrid, or hybrid-cosmos
dbManager.isHybrid();    // true if hybrid or hybrid-cosmos

// Get detailed info
const info = dbManager.getDatabaseInfo();
console.log(info);
// { type: 'cosmosdb', primaryDatabase: 'CosmosDB', ... }
```

---

## 🔄 Switching Databases

### Via Script (Recommended)
```bash
npm run switch-db mysql          # Switch to MySQL
npm run switch-db firebase       # Switch to Firebase
npm run switch-db cosmosdb       # Switch to Cosmos DB
npm run switch-db hybrid         # MySQL + Firebase
npm run switch-db hybrid-cosmos  # MySQL + Cosmos DB
```

### Manual (Update .env)
```env
DB_TYPE=cosmosdb  # Change this line
```

Then restart:
```bash
npm start
```

---

## 🏗️ Collection Structure

Cosmos DB uses document/collection model (same as Firebase):

```
monitor_db/
├── sensors/          # Collection
│   ├── { _id: "abc123", temperature: 25, ... }
│   ├── { _id: "def456", temperature: 26, ... }
│   └── { _id: "ghi789", temperature: 24, ... }
├── users/
└── logs/
```

**Note:** Cosmos DB uses `_id`, but adapter exposes it as `id` for compatibility.

---

## 🔒 Security & Encryption

Same encryption as MySQL/Firebase (automatic):

```javascript
// Sensitive fields auto-encrypted
await db.postData('users', {
    name: 'John',       // ← Encrypted (contains 'name')
    email: 'a@b.com',   // ← Encrypted (contains 'email')
    password: 'secret', // ← Encrypted (contains 'password')
    age: 30             // Not encrypted
});
```

Configure in .env:
```env
DB_ENCRYPTION_KEY=your-32-character-secret-key
```

---

## 🐛 Troubleshooting

### Cannot connect to Cosmos DB
✓ Check connection string includes `?ssl=true`
✓ Verify account name and key are correct
✓ Check Azure firewall rules
✓ Ensure MongoDB API (not SQL API)

### Module not found
```bash
npm install  # Install all dependencies
```

### Database not initializing
```javascript
// Check configuration
const info = databaseManager.getDatabaseInfo();
console.log('DB Type:', info.type);
console.log('Config:', info);
```

### Change streams not working
✓ Cosmos DB must use provisioned throughput (not serverless)
✓ Collection must have at least one document
✓ Check MongoDB compatibility version (4.0+)

---

## 📊 Cost Estimation

| Tier | Monthly Cost | Use Case |
|------|--------------|----------|
| Serverless | ~$25 | Dev/Testing |
| Provisioned (400 RU/s) | ~$24 | Small production |
| Autoscale (400-4000 RU/s) | ~$50-100 | Growing apps |
| High throughput | $200+ | Enterprise scale |

Start with **Serverless** for development!

---

## 📚 Documentation Files

- **`INTEGRATION_SUMMARY.md`** - Full integration explanation
- **`ARCHITECTURE_DIAGRAM.md`** - Visual architecture diagrams
- **`AZURE_INTEGRATION.md`** - Complete Cosmos DB guide
- **`AZURE_QUICK_START.md`** - 3-step quick start
- **`CLAUDE.md`** - Framework architecture overview

---

## ✅ Checklist

Setup:
- [ ] Run `npm install`
- [ ] Add Cosmos DB connection string to `.env`
- [ ] Set `DB_TYPE=cosmosdb` (or run `npm run switch-db cosmosdb`)
- [ ] Start app: `npm start` or `npm run start:electron`

Verify:
- [ ] Check console for "Azure Cosmos DB connected"
- [ ] Test insert: `await db.postData('test', { msg: 'hello' })`
- [ ] Test query: `await db.table('test').get()`
- [ ] Test subscription: `await db.subscribe('test', callback)`

Production:
- [ ] Configure Azure firewall rules
- [ ] Set up monitoring in Azure Portal
- [ ] Choose appropriate RU/s tier
- [ ] Enable encryption: Set `DB_ENCRYPTION_KEY`

---

## 🎉 You're Ready!

Your Monitor Framework now supports:
- ✅ MySQL (relational)
- ✅ Firebase (Google Cloud NoSQL)
- ✅ **Azure Cosmos DB (Azure Cloud NoSQL)** ← NEW!
- ✅ Hybrid modes (primary + secondary sync)

**All with the same unified API!** 🚀

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev environment
npm run dev:backend      # Backend only
npm start                # Production server
npm run start:electron   # Desktop app

# Database
npm run switch-db cosmosdb       # Switch to Cosmos DB
npm run switch-db hybrid-cosmos  # MySQL + Cosmos DB

# Testing
npm test                 # Run tests
npm run lint             # Check code quality
```

**That's it! Everything is already integrated and ready to use.** 🎯
