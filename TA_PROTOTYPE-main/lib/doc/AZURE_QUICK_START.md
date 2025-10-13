# Azure Cosmos DB - Quick Start Guide

## 🚀 Yes, You Can Use Azure Cosmos DB!

Your Monitor Framework now supports **Azure Cosmos DB** as a collection-based database option - **exactly like Firebase!**

## Why This Works Perfectly

✅ **Collection-based structure** - Same as Firebase/Firestore
✅ **Same query API** - Your Firebase code works with minimal changes
✅ **Real-time subscriptions** - Change streams work like Firebase `onSnapshot()`
✅ **Document model** - JSON documents in collections
✅ **Auto-scaling** - Built-in scalability with Azure

## 3-Step Setup

### Step 1: Install Dependencies

```bash
npm install
```

*(Already includes `@azure/cosmos` and `mongodb` packages)*

### Step 2: Configure Azure Cosmos DB

Add to `.env`:

```env
DB_TYPE=cosmosdb
COSMOS_CONNECTION_STRING=mongodb://your-account:your-key@your-account.mongo.cosmos.azure.com:10255/?ssl=true
COSMOS_DATABASE=monitor_db
```

### Step 3: Switch Database

```bash
npm run switch-db cosmosdb
```

**That's it!** Your app now uses Azure Cosmos DB.

## Usage - Same as Firebase!

```javascript
const db = require('./lib/db/databaseAdapter').getInstance();

// Insert (same API as Firebase)
await db.postData('sensors', {
    temperature: 25,
    humidity: 60
});

// Query (same API as Firebase)
const data = await db.table('sensors')
    .where('temperature', '>', 20)
    .orderByDesc('timestamp')
    .limit(10)
    .get();

// Real-time (same API as Firebase)
const unsubscribe = await db.subscribe('sensors', (change) => {
    console.log('New data:', change.data);
});
```

## Available Database Modes

| Mode | Command | Description |
|------|---------|-------------|
| **MySQL** | `npm run switch-db mysql` | Traditional relational DB |
| **Firebase** | `npm run switch-db firebase` | Google Firebase/Firestore |
| **Cosmos DB** | `npm run switch-db cosmosdb` | Azure Cosmos DB (MongoDB API) |
| **Hybrid** | `npm run switch-db hybrid` | MySQL + Firebase sync |
| **Hybrid Cosmos** | `npm run switch-db hybrid-cosmos` | MySQL + Cosmos DB sync |

## Why Choose Cosmos DB Over Firebase?

| Feature | Firebase | Cosmos DB |
|---------|----------|-----------|
| **Cloud Provider** | Google Cloud | Microsoft Azure |
| **Global Distribution** | ✓ | ✓ (Multi-region write) |
| **Collection-based** | ✓ | ✓ |
| **Query Language** | Firebase | MongoDB |
| **Real-time** | Yes | Yes (Change Streams) |
| **Pricing** | Pay-per-use | Flexible (provisioned/serverless) |
| **Integration** | Google services | Azure ecosystem |

**Choose Cosmos DB if:**
- You're already using Azure services
- You need MongoDB compatibility
- You want flexible pricing options
- You need multi-region writes

**Choose Firebase if:**
- You're using Google Cloud
- You want simpler setup
- You prefer Firebase SDK features

## Hybrid Mode - Best of Both Worlds

Run both MySQL and Cosmos DB together:

```bash
npm run switch-db hybrid-cosmos
```

**How it works:**
- MySQL is **PRIMARY** (all writes + reads)
- Cosmos DB is **SECONDARY** (auto-synced for backup/analytics)
- If MySQL fails, reads fall back to Cosmos DB

**Benefits:**
- Keep your relational MySQL database
- Get NoSQL flexibility with Cosmos DB
- Automatic replication for disaster recovery
- Run analytics on Cosmos DB without impacting MySQL

## Migration from Firebase to Cosmos DB

Since both use collections, migration is simple:

```javascript
// 1. Export from Firebase
const firebaseDb = new FirebaseDB(firebaseConfig);
const data = await firebaseDb.table('sensors').get();

// 2. Import to Cosmos DB
const cosmosDb = new CosmosDB(cosmosConfig);
for (const record of data) {
    await cosmosDb.postData('sensors', record);
}

// 3. Update .env
DB_TYPE=cosmosdb

// Done!
```

## Collection Structure

Both Firebase and Cosmos DB use the same structure:

```
database/
├── sensors/       # Collection
│   ├── doc1      # Document
│   ├── doc2
│   └── doc3
├── users/
└── logs/
```

**Note:** Cosmos DB uses `_id` field, but the adapter exposes it as `id` for compatibility.

## Azure Portal Setup (5 minutes)

1. **Create Cosmos DB Account**
   - Go to Azure Portal → Create Resource
   - Select "Azure Cosmos DB"
   - Choose API: **"Azure Cosmos DB for MongoDB"** ⚠️ Important!
   - Select region and pricing tier

2. **Get Connection String**
   - Go to your Cosmos DB account
   - Click "Connection String" in left menu
   - Copy "Primary Connection String"

3. **Add to `.env`**
   ```env
   COSMOS_CONNECTION_STRING=<paste connection string here>
   ```

## Cost Estimation

| Tier | Cost | Use Case |
|------|------|----------|
| **Serverless** | ~$25/month | Development, testing |
| **Provisioned (400 RU/s)** | ~$24/month | Small production |
| **Autoscale (400-4000 RU/s)** | ~$50-100/month | Growing apps |
| **High throughput** | $200+/month | Large scale |

💡 **Tip:** Start with Serverless for development, upgrade to Autoscale for production.

## Real-time Change Streams

Works exactly like Firebase subscriptions:

```javascript
// Subscribe to changes
const unsubscribe = await db.subscribe('sensors', (change) => {
    switch(change.type) {
        case 'insert':
            console.log('New document:', change.data);
            break;
        case 'update':
            console.log('Updated:', change.data);
            break;
        case 'delete':
            console.log('Deleted:', change.id);
            break;
    }
});

// Cleanup
unsubscribe();
```

## Troubleshooting

### "Cannot connect to Cosmos DB"

✓ Verify connection string includes `?ssl=true`
✓ Check Azure firewall rules (allow your IP)
✓ Ensure you selected **MongoDB API** (not SQL API)

### "Change streams not working"

✓ Change streams require provisioned throughput (not serverless)
✓ Ensure collection has at least one document

### "Queries are slow"

✓ Add indexes in Azure Portal
✓ Use partition keys for large collections
✓ Check RU consumption and increase if needed

## Full Documentation

📚 See `AZURE_INTEGRATION.md` for complete guide including:
- Advanced queries
- Performance optimization
- Security & encryption
- Migration strategies
- Cost management

## Questions?

Your existing framework architecture already supports everything! Just:

1. Set up Cosmos DB in Azure
2. Configure `.env` with connection string
3. Run `npm run switch-db cosmosdb`
4. Use the same database API you're already using!

**The modular adapter pattern makes it seamless.** 🎉
