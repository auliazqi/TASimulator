# Monitor Framework - Azure Cosmos DB Architecture

## Complete Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION ENTRY POINTS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   main.js (Electron)              server.js (Web Server)        │
│        │                                   │                     │
│        └───────────────┬───────────────────┘                     │
│                        ↓                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     CORE MODULE LAYER                            │
│                  (modules/database/)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│              DatabaseManager (databaseManager.js)                │
│                                                                   │
│   - Reads DB_TYPE from .env                                     │
│   - Initializes DatabaseAdapter (singleton)                     │
│   - Provides db instance to all modules                         │
│                                                                   │
│        ┌──────────────────┴──────────────────┐                  │
│        ↓                                      ↓                  │
│   APIServer          SerialManager    WebsocketManager          │
│   (needs db)         (needs db)       (needs db)                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE ADAPTER LAYER                          │
│                   (lib/db/)                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│          DatabaseAdapter (databaseAdapter.js) - SINGLETON        │
│                                                                   │
│   Supported DB_TYPE values:                                     │
│   ├─ mysql          → MySQL only                                │
│   ├─ firestore      → Firebase/Firestore only                   │
│   ├─ cosmosdb       → Azure Cosmos DB only                      │
│   ├─ hybrid         → MySQL (primary) + Firebase (secondary)    │
│   └─ hybrid-cosmos  → MySQL (primary) + Cosmos DB (secondary)   │
│                                                                   │
│        ┌──────────────┴──────────────────┐                      │
│        ↓              ↓                   ↓                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE DRIVER LAYER                          │
│                      (lib/db/)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   mysqlDB.js         firebaseDB.js         cosmosDB.js          │
│   ┌─────────┐        ┌──────────┐         ┌──────────┐          │
│   │ MySQL   │        │ Firebase │         │ Cosmos   │          │
│   │ Query   │        │ Realtime │         │ MongoDB  │          │
│   │ Builder │        │    OR    │         │   API    │          │
│   │         │        │Firestore │         │          │          │
│   └─────────┘        └──────────┘         └──────────┘          │
│        ↓                  ↓                     ↓                │
│   Relational        Collection            Collection            │
│   Tables            Documents             Documents             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   MySQL Server      Firebase Cloud       Azure Cosmos DB        │
│   (localhost        (Google Cloud)       (Azure Cloud)          │
│    or remote)                                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Scenario: Serial Manager saves sensor data

```
┌────────────────────────────────────────────────────────────────┐
│ 1. SENSOR DATA ARRIVES                                         │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 2. SerialManager (modules/serial/serialManager.js)             │
│                                                                 │
│    this.database.postData('sensors', {                         │
│        temperature: 25,                                         │
│        humidity: 60                                             │
│    })                                                           │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 3. DatabaseAdapter (lib/db/databaseAdapter.js)                 │
│                                                                 │
│    async postData(tableName, data) {                           │
│        // Route to correct database based on DB_TYPE          │
│        const result = await this.primaryDb.postData(...)       │
│                                                                 │
│        // If hybrid mode, sync to secondary                    │
│        if (this.secondaryDb) {                                 │
│            this._syncToSecondary('postData', ...)              │
│        }                                                        │
│    }                                                            │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 4. CosmosDB Driver (lib/db/cosmosDB.js)                        │
│                                                                 │
│    async postData(collectionName, data) {                      │
│        const collection = this.db.collection(collectionName)   │
│        const result = await collection.insertOne(data)         │
│        return { insertId: result.insertedId }                  │
│    }                                                            │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 5. Azure Cosmos DB (Cloud)                                     │
│                                                                 │
│    sensors/                                                     │
│    └── { _id: "abc123",                                        │
│         temperature: 25,                                        │
│         humidity: 60,                                           │
│         created_at: "2025-10-07T..." }                         │
└────────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     .env FILE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   DB_TYPE=cosmosdb                    ← Controls everything     │
│   COSMOS_CONNECTION_STRING=...                                  │
│   COSMOS_DATABASE=monitor_db                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         npm run switch-db cosmosdb (Optional Helper)            │
│                                                                   │
│   - Reads current .env                                          │
│   - Updates DB_TYPE=cosmosdb                                    │
│   - Preserves all other settings                                │
│   - Shows setup instructions                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              DatabaseManager reads DB_TYPE                       │
│                                                                   │
│   const dbType = process.env.DB_TYPE || 'mysql';                │
│                                                                   │
│   if (['mysql','firestore','cosmosdb','hybrid'].includes(type)) │
│       ↓ Initialize DatabaseAdapter                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│         DatabaseAdapter initializes correct driver              │
│                                                                   │
│   if (type === 'cosmosdb') {                                    │
│       const cosmosDB = new CosmosDB(config.cosmosdb)            │
│       await cosmosDB.connect()                                   │
│       this.primaryDb = cosmosDB                                 │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Hybrid Mode Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    DB_TYPE=hybrid-cosmos                        │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│              DatabaseAdapter (Hybrid Mode)                      │
│                                                                 │
│   PRIMARY:    MySQL (mysqlDB.js)                               │
│   SECONDARY:  Cosmos DB (cosmosDB.js)                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────┐          │
│   │ Write Operation Flow:                           │          │
│   │                                                  │          │
│   │ 1. Write to MySQL (PRIMARY) ✓                   │          │
│   │ 2. Auto-sync to Cosmos DB (SECONDARY)           │          │
│   │    (async, doesn't block)                       │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                 │
│   ┌─────────────────────────────────────────────────┐          │
│   │ Read Operation Flow:                            │          │
│   │                                                  │          │
│   │ 1. Read from MySQL (PRIMARY)                    │          │
│   │ 2. If MySQL fails → Fallback to Cosmos DB       │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

Benefits:
✓ MySQL for fast relational queries
✓ Cosmos DB for global distribution & backup
✓ Automatic failover
✓ No application code changes
```

## Module Dependency Injection

```
┌─────────────────────────────────────────────────────────────────┐
│                main.js / server.js                               │
│                                                                   │
│   // 1. Initialize Database                                     │
│   const databaseManager = new DatabaseManager()                 │
│   await databaseManager.initialize()                            │
│   const db = databaseManager.getDatabase()  ← DatabaseAdapter   │
│                                                                   │
│   // 2. Pass to other modules                                   │
│   const apiServer = new APIServer(db)                           │
│   const serialManager = new SerialManager(db, window)           │
│   const websocketManager = new WebsocketManager(db, window)     │
│   const ipcManager = new IPCManager(db, serialManager)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              ALL MODULES RECEIVE SAME DB INSTANCE                │
│                                                                   │
│   APIServer          SerialManager       WebsocketManager       │
│   ┌──────────┐       ┌──────────┐        ┌──────────┐           │
│   │ this.db  │       │ this.db  │        │ this.db  │           │
│   │    ↓     │       │    ↓     │        │    ↓     │           │
│   │ Same DB  │       │ Same DB  │        │ Same DB  │           │
│   └──────────┘       └──────────┘        └──────────┘           │
│                                                                   │
│   All modules use the SAME database adapter instance            │
│   → Works with MySQL, Firebase, or Cosmos DB transparently      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database API Compatibility

All three databases expose the same interface:

```javascript
// Same API for MySQL, Firebase, and Cosmos DB

// Insert
await db.postData('sensors', { temperature: 25 })

// Query with filters
await db.getDataByFilters('sensors',
    { status: 'active' },
    { orderBy: 'timestamp DESC', limit: 10 }
)

// Update
await db.updateData('sensors',
    { status: 'inactive' },
    'id = ?',
    ['sensor-123']
)

// Delete
await db.deleteData('sensors', 'id = ?', ['sensor-123'])

// Query Builder (MySQL & Cosmos)
await db.table('sensors')
    .where('temperature', '>', 20)
    .orderByDesc('timestamp')
    .limit(10)
    .get()

// Real-time Subscription (Firebase & Cosmos)
const unsubscribe = await db.subscribe('sensors', (change) => {
    console.log('Data changed:', change)
})
```

## Key Takeaways

1. **✅ Module Integration**: DatabaseManager in `modules/database/` handles everything
2. **✅ Library Layer**: DatabaseAdapter in `lib/db/` provides abstraction
3. **✅ Driver Layer**: cosmosDB.js implements MongoDB API for Cosmos DB
4. **✅ Zero Changes**: Existing modules work without modification
5. **✅ Collection-based**: Cosmos DB works exactly like Firebase
6. **✅ Hybrid Support**: Can use multiple databases simultaneously

**Your modular architecture made this integration seamless!** 🎉
