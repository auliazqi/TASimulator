# Azure Cosmos DB Integration Guide

This guide explains how to use **Azure Cosmos DB** with the Monitor Framework. Cosmos DB is configured to use the **MongoDB API**, providing a **collection-based structure similar to Firebase/Firestore**.

## Why Azure Cosmos DB?

- **Collection-based database** - Works exactly like Firebase/Firestore collections
- **Global distribution** - Multi-region replication built-in
- **Auto-scaling** - Automatic throughput and storage scaling
- **MongoDB compatibility** - Use familiar MongoDB queries and operations
- **Change feeds** - Real-time subscriptions like Firebase (via change streams)
- **Multi-model support** - Can also use SQL, Gremlin, Table, or Cassandra APIs

## Architecture Integration

Azure Cosmos DB is fully integrated into the modular architecture:

**Flow:**
```
DatabaseManager (modules/database/databaseManager.js)
    ↓
DatabaseAdapter (lib/db/databaseAdapter.js)
    ↓
CosmosDB (lib/db/cosmosDB.js) - MongoDB API driver
```

The **DatabaseManager module** automatically detects `DB_TYPE` and initializes the correct database through the **DatabaseAdapter**, which handles MySQL, Firebase, and Cosmos DB seamlessly.

## Setup Azure Cosmos DB

### 1. Create Azure Cosmos DB Account

In Azure Portal:

1. Create a new **Azure Cosmos DB account**
2. Choose API: **Azure Cosmos DB for MongoDB**
3. Select region and pricing tier
4. Note your account name and primary connection string

### 2. Install Dependencies

```bash
npm install @azure/cosmos mongodb
```

*(Already included in package.json)*

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Set database type
DB_TYPE=cosmosdb

# Azure Cosmos DB Configuration
# Option 1: Use connection string (recommended)
COSMOS_CONNECTION_STRING=mongodb://your-account:your-key@your-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false

# Option 2: Use account credentials
COSMOS_ACCOUNT_NAME=your-cosmos-account
COSMOS_ACCOUNT_KEY=your-primary-key
COSMOS_DATABASE=monitor_db
```

### 4. Switch to Cosmos DB

```bash
npm run switch-db cosmosdb
```

## Database Modes

### Mode 1: Cosmos DB Only

```bash
npm run switch-db cosmosdb
```

- All data stored in Azure Cosmos DB
- Collection-based structure
- Change stream support for real-time updates

### Mode 2: Hybrid with MySQL

```bash
npm run switch-db hybrid-cosmos
```

- MySQL as **primary** database (writes + reads)
- Cosmos DB as **secondary** database (auto-sync backup)
- Automatic replication from MySQL to Cosmos DB

### Mode 3: Traditional Options

```bash
npm run switch-db mysql       # MySQL only
npm run switch-db firebase    # Firebase/Firestore only
npm run switch-db hybrid      # MySQL + Firebase
```

## Usage Examples

### Basic Operations

The Cosmos DB adapter works **exactly like Firebase** with the same API:

```javascript
const db = require('./lib/db/databaseAdapter').getInstance();
await db.initialize();

// Insert data (same as Firebase)
const result = await db.postData('sensors', {
    temperature: 25.5,
    humidity: 60,
    timestamp: new Date()
});

// Query data (same as Firebase)
const sensors = await db.getDataByFilters('sensors', {
    temperature: { operator: '>', value: 20 }
}, {
    orderBy: 'timestamp DESC',
    limit: 10
});

// Update data
await db.updateData('sensors',
    { status: 'active' },
    'id = ?',
    ['sensor123']
);

// Delete data
await db.deleteData('sensors', 'id = ?', ['sensor123']);
```

### Query Builder (Collection-based)

```javascript
// Works exactly like Firebase query builder
const recentSensors = await db.table('sensors')
    .where('temperature', '>', 20)
    .where('humidity', '<', 80)
    .orderBy('timestamp', 'DESC')
    .limit(10)
    .get();

// Multiple filters
const filtered = await db.table('users')
    .whereIn('status', ['active', 'pending'])
    .whereBetween('age', 18, 65)
    .orderByDesc('created_at')
    .get();

// First record
const latest = await db.table('sensors')
    .orderByDesc('timestamp')
    .first();

// Count records
const count = await db.table('sensors')
    .where('status', 'active')
    .count();
```

### Real-time Subscriptions (Change Streams)

Like Firebase subscriptions, but using Cosmos DB change streams:

```javascript
// Subscribe to collection changes
const unsubscribe = await db.subscribe('sensors', (change) => {
    console.log('Change type:', change.type); // 'insert', 'update', 'delete'
    console.log('Document ID:', change.id);
    console.log('Data:', change.data);
}, { status: 'active' }); // Optional filters

// Unsubscribe when done
unsubscribe();
```

### MongoDB-specific Operations

Access advanced MongoDB features:

```javascript
const cosmosDb = db.databases.get('cosmosdb');

// Aggregation pipeline
const stats = await cosmosDb.aggregate('sensors', [
    { $match: { status: 'active' } },
    { $group: {
        _id: '$location',
        avgTemp: { $avg: '$temperature' },
        count: { $sum: 1 }
    }}
]);
```

## Comparison: Firebase vs Cosmos DB

| Feature | Firebase | Cosmos DB (MongoDB API) |
|---------|----------|-------------------------|
| Data Model | Collections/Documents | Collections/Documents |
| Query Syntax | Firebase queries | MongoDB queries |
| Real-time | `onSnapshot()` | Change Streams |
| Scaling | Automatic | Automatic + configurable RU/s |
| Global Distribution | ✓ | ✓ |
| Offline Support | Client SDK | Via MongoDB drivers |
| Pricing | Pay-per-use | Provisioned/Serverless |

**Key Advantage**: Your existing Firebase code works with minimal changes!

## Migration from Firebase to Cosmos DB

### 1. Export Firebase Data

```javascript
// Export from Firebase
const firebaseDb = new FirebaseDB(config);
const data = await firebaseDb.table('sensors').get();

// Import to Cosmos DB
const cosmosDb = new CosmosDB(config);
for (const record of data) {
    await cosmosDb.postData('sensors', record);
}
```

### 2. Update DB_TYPE

```bash
npm run switch-db cosmosdb
```

### 3. Test Queries

Run your existing queries - they should work identically!

## Collection Structure

Cosmos DB collections work like Firebase collections:

```
monitor_db/
├── sensors/          # Collection (like Firebase)
│   ├── doc1          # Document with _id
│   ├── doc2
│   └── doc3
├── users/
└── logs/
```

**Note**: Cosmos DB uses `_id` instead of Firebase's auto-generated IDs, but the adapter handles this transparently with the `id` field.

## Performance Optimization

### Indexing

Cosmos DB automatically indexes all fields. For better performance:

```javascript
// Create compound index via Azure Portal
// sensors collection: { timestamp: -1, status: 1 }
```

### Request Units (RU/s)

Monitor and adjust throughput in Azure Portal:
- **Provisioned**: Set fixed RU/s (predictable cost)
- **Autoscale**: Automatically scale based on usage
- **Serverless**: Pay-per-request (development/staging)

### Partitioning

For large datasets, use partition keys:

```javascript
// When creating collection in Azure Portal
// Partition key: /status or /location
```

## Encryption & Security

The Cosmos DB adapter includes the same encryption as Firebase/MySQL:

```javascript
// Sensitive fields are automatically encrypted
await db.postData('users', {
    name: 'John',        // Encrypted (contains 'name')
    email: 'a@b.com',    // Encrypted (contains 'email')
    password: 'secret',  // Encrypted (contains 'password')
    age: 30              // Not encrypted
});
```

Configure encryption key in `.env`:
```env
DB_ENCRYPTION_KEY=your-32-character-encryption-key
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Cosmos DB

**Solution**:
1. Verify connection string is correct
2. Check firewall rules in Azure Portal
3. Ensure SSL is enabled (`?ssl=true` in connection string)
4. Verify MongoDB API is selected (not SQL API)

### Query Performance

**Problem**: Slow queries

**Solution**:
1. Add indexes in Azure Portal
2. Use partition keys for large collections
3. Monitor RU consumption in Azure Portal
4. Consider autoscaling or increasing provisioned RU/s

### Change Streams Not Working

**Problem**: Real-time subscriptions not triggering

**Solution**:
1. Ensure collection has activity (change streams require active data)
2. Verify MongoDB version compatibility (4.0+)
3. Check if serverless tier (change streams require provisioned)

## Cost Estimation

**Development/Testing**: ~$25/month (serverless tier)
**Production (small)**: ~$50-100/month (autoscale 400-4000 RU/s)
**Production (large)**: $200+/month (provisioned high RU/s + global distribution)

Monitor costs in Azure Cost Management.

## Hybrid Mode Benefits

Using `hybrid-cosmos` mode:

```bash
npm run switch-db hybrid-cosmos
```

**Benefits**:
- MySQL: Fast relational queries, transactions
- Cosmos DB: Global distribution, NoSQL flexibility
- Automatic sync: Changes in MySQL replicate to Cosmos DB
- Failover: If MySQL fails, read from Cosmos DB

**Use Cases**:
- Multi-region applications
- Disaster recovery setup
- Analytics on NoSQL replica while keeping relational primary

## Example: Complete Application Flow

```javascript
// 1. Initialize with Cosmos DB
const { getInstance } = require('./lib/db/databaseAdapter');
const db = getInstance();
await db.initialize(); // Connects to Cosmos DB

// 2. Insert sensor data
const result = await db.postData('sensors', {
    deviceId: 'ESP32-001',
    temperature: 25.5,
    humidity: 60,
    location: 'warehouse-a',
    status: 'active'
});

// 3. Query recent active sensors
const sensors = await db.table('sensors')
    .where('status', 'active')
    .where('temperature', '>', 20)
    .orderByDesc('created_at')
    .limit(10)
    .get();

// 4. Subscribe to real-time changes
const unsubscribe = await db.subscribe('sensors', (change) => {
    if (change.type === 'insert') {
        console.log('New sensor data:', change.data);
        // Broadcast to frontend via WebSocket
        websocketManager.broadcastToAll({
            type: 'sensor_update',
            data: change.data
        });
    }
});

// 5. Cleanup
process.on('SIGTERM', async () => {
    unsubscribe();
    await db.close();
});
```

## Next Steps

1. **Set up Cosmos DB** account in Azure Portal
2. **Configure** connection string in `.env`
3. **Switch** database: `npm run switch-db cosmosdb`
4. **Test** with existing queries - they should work!
5. **Monitor** RU consumption in Azure Portal
6. **Optimize** with indexes and partitioning

For more details, see:
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [MongoDB API Guide](https://docs.microsoft.com/azure/cosmos-db/mongodb/introduction)
- Project `CLAUDE.md` for database architecture
