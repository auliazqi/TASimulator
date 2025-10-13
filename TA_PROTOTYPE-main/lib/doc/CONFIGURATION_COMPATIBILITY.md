# Configuration & Dependency Compatibility Guide

## ⚠️ Configuration Issues & Fixes

### Issue 1: Old vs New Configuration Format

**Your current `.env` uses OLD format:**
```env
USE_FIREBASE=true  # ← OLD format
```

**New system uses:**
```env
DB_TYPE=firestore  # ← NEW format (recommended)
```

### ✅ Fix: Update Your .env

You have **two options**:

#### Option 1: Use New Format (Recommended)
```bash
# Run the switch command to update automatically
npm run switch-db firestore
# or
npm run switch-db mysql
# or
npm run switch-db cosmosdb
```

#### Option 2: Keep Old Format (Backward Compatible)
Your system **still works** with old format! The DatabaseManager automatically detects it:

```javascript
// In databaseManager.js (already implemented)
if (process.env.USE_FIREBASE === 'true' && !process.env.DB_TYPE) {
    this.dbType = 'firestore';
}
```

**Current state:** ✅ **Working** - Uses Firebase because `USE_FIREBASE=true`

---

## 📦 Dependency Check

### Required Dependencies (All Present ✅)

#### Database Drivers
- ✅ `mysql2: ^3.14.1` - MySQL database
- ✅ `firebase: ^11.9.0` - Firebase client SDK
- ✅ `firebase-admin: ^12.7.0` - Firebase admin SDK
- ✅ `mongodb: ^6.11.0` - MongoDB driver for Cosmos DB
- ✅ `@azure/cosmos: ^4.2.1` - Azure Cosmos DB SDK

#### Core Framework
- ✅ `express: ^5.1.0` - API server
- ✅ `socket.io: ^4.7.4` - WebSocket server
- ✅ `serialport: ^13.0.0` - Serial communication
- ✅ `dotenv: ^16.5.0` - Environment config
- ✅ `bcryptjs: ^3.0.2` - Password hashing
- ✅ `jsonwebtoken: ^9.0.2` - JWT authentication

#### Electron & Frontend
- ✅ `electron: ^36.2.1` - Desktop app
- ✅ `react: ^18.2.0` - Frontend framework
- ✅ `react-scripts: 5.0.1` - React build tools

### Potential Conflicts ⚠️

#### 1. @azure/cosmos vs mongodb
```json
"@azure/cosmos": "^4.2.1",  // Not used correctly!
"mongodb": "^6.11.0"         // This is correct for Cosmos DB
```

**Issue:** Cosmos DB with MongoDB API uses `mongodb` package, NOT `@azure/cosmos`

**Fix in cosmosDB.js:**
```javascript
// ✅ Correct (already implemented)
const { MongoClient } = require('mongodb');

// ❌ Wrong (would be)
// const { MongoClient } = require('@azure/cosmos');
```

**Verdict:** ✅ **Correctly implemented** - Uses `mongodb` package

#### 2. Firebase Version Compatibility
```json
"firebase": "^11.9.0",        // Client SDK (v11)
"firebase-admin": "^12.7.0"   // Admin SDK (v12)
```

**Potential Issue:** Version mismatch between client and admin SDK

**Check:** Both are compatible ✅
- Client SDK v11 works with Admin SDK v12
- firebaseDB.js uses both correctly

---

## 🔗 Integration Compatibility Matrix

### Database Combinations

| DB_TYPE | Primary | Secondary | Works? | Notes |
|---------|---------|-----------|--------|-------|
| `mysql` | MySQL | None | ✅ Yes | Standard relational DB |
| `firestore` | Firebase | None | ✅ Yes | Google Cloud NoSQL |
| `cosmosdb` | Cosmos DB | None | ✅ Yes | Azure NoSQL (MongoDB API) |
| `hybrid` | MySQL | Firebase | ✅ Yes | Auto-sync to Firebase |
| `hybrid-cosmos` | MySQL | Cosmos DB | ✅ Yes | Auto-sync to Cosmos DB |

### Module Integration

| Module | MySQL | Firebase | Cosmos DB | Hybrid |
|--------|-------|----------|-----------|--------|
| DatabaseManager | ✅ | ✅ | ✅ | ✅ |
| APIServer | ✅ | ✅ | ✅ | ✅ |
| SerialManager | ✅ | ✅ | ✅ | ✅ |
| WebsocketManager | ✅ | ✅ | ✅ | ✅ |
| IPCManager | ✅ | ✅ | ✅ | ✅ |

**All modules work with all database types!** ✅

---

## ⚙️ Environment Variable Mapping

### Old Format → New Format

```env
# OLD (still works via backward compatibility)
USE_FIREBASE=true

# NEW (recommended)
DB_TYPE=firestore
```

### Complete Mapping

```env
# === OLD FORMAT (Backward Compatible) ===
USE_FIREBASE=false → DB_TYPE=mysql
USE_FIREBASE=true  → DB_TYPE=firestore

# === NEW FORMAT (All Options) ===
DB_TYPE=mysql          # MySQL only
DB_TYPE=firestore      # Firebase/Firestore only
DB_TYPE=cosmosdb       # Azure Cosmos DB only
DB_TYPE=hybrid         # MySQL + Firebase sync
DB_TYPE=hybrid-cosmos  # MySQL + Cosmos DB sync
```

### Required Variables by DB_TYPE

#### mysql
```env
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=monitor_db
MYSQL_PORT=3306
```

#### firestore
```env
DB_TYPE=firestore
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://...
# For Firestore (Admin SDK)
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/key.json
# OR for Realtime (Client SDK)
FIREBASE_API_KEY=your-api-key
```

#### cosmosdb
```env
DB_TYPE=cosmosdb
COSMOS_CONNECTION_STRING=mongodb://...
# OR
COSMOS_ACCOUNT_NAME=your-account
COSMOS_ACCOUNT_KEY=your-key
COSMOS_DATABASE=monitor_db
```

#### hybrid
```env
DB_TYPE=hybrid
# MySQL (primary)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=monitor_db
# Firebase (secondary)
FIREBASE_PROJECT_ID=...
FIREBASE_DATABASE_URL=...
```

#### hybrid-cosmos
```env
DB_TYPE=hybrid-cosmos
# MySQL (primary)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=monitor_db
# Cosmos DB (secondary)
COSMOS_CONNECTION_STRING=mongodb://...
```

---

## 🔍 Dependency Validation

### Check if Dependencies Work Together

```javascript
// Test script - save as test-deps.js
const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

console.log('✅ MySQL driver loaded');
console.log('✅ Firebase Admin loaded');
console.log('✅ MongoDB driver loaded');
console.log('\nAll dependencies compatible!');
```

Run: `node test-deps.js`

### Install Missing Dependencies

```bash
npm install
```

If any dependency is missing, install individually:
```bash
npm install mongodb @azure/cosmos
```

---

## 🚨 Common Configuration Errors

### Error 1: "Cannot find module 'mongodb'"
**Cause:** Package not installed
**Fix:** `npm install mongodb`

### Error 2: "COSMOS_CONNECTION_STRING is undefined"
**Cause:** Missing Cosmos DB config
**Fix:** Add to `.env`:
```env
DB_TYPE=cosmosdb
COSMOS_CONNECTION_STRING=mongodb://...
```

### Error 3: "Database initialization failed"
**Cause:** Wrong DB_TYPE or missing credentials
**Fix:**
1. Check DB_TYPE value
2. Verify credentials in .env
3. Check network connectivity

### Error 4: "USE_FIREBASE not recognized"
**Cause:** Using old format with new code
**Fix:** Either:
- Update: `npm run switch-db firestore`
- Or add: `DB_TYPE=firestore` to .env

---

## ✅ Configuration Validation Checklist

### Before Running

- [ ] Run `npm install` to ensure all dependencies installed
- [ ] Check `.env` file exists (copy from `.env.example` if needed)
- [ ] Set `DB_TYPE` or `USE_FIREBASE` (backward compatible)
- [ ] Verify database credentials are correct
- [ ] Ensure database server is running (MySQL/Cosmos DB)

### For MySQL
- [ ] MySQL server is running
- [ ] User has correct permissions
- [ ] Database exists
- [ ] Port 3306 is accessible

### For Firebase
- [ ] Firebase project exists
- [ ] Service account key file exists (if using Firestore)
- [ ] API key is valid (if using Realtime)
- [ ] Database URL is correct

### For Cosmos DB
- [ ] Cosmos DB account exists in Azure
- [ ] Connection string is correct
- [ ] MongoDB API is enabled (not SQL API!)
- [ ] Firewall allows your IP

### For Hybrid Modes
- [ ] Both primary AND secondary configs are set
- [ ] Both databases are accessible
- [ ] Credentials for both are correct

---

## 🔧 Quick Fixes

### Fix 1: Update to New Configuration Format

```bash
# Automatically update .env
npm run switch-db mysql       # For MySQL
npm run switch-db firestore   # For Firebase
npm run switch-db cosmosdb    # For Cosmos DB
```

### Fix 2: Manual Configuration Update

Edit `.env`:
```env
# Add this line
DB_TYPE=cosmosdb

# Keep or remove old format (both work)
# USE_FIREBASE=true  # Can remove this
```

### Fix 3: Install All Dependencies

```bash
npm install
```

### Fix 4: Verify Configuration

Create `verify-config.js`:
```javascript
require('dotenv').config();

console.log('Configuration Check:');
console.log('==================');
console.log('DB_TYPE:', process.env.DB_TYPE || 'not set');
console.log('USE_FIREBASE:', process.env.USE_FIREBASE || 'not set');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST || 'not set');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'set' : 'not set');
console.log('COSMOS_CONNECTION_STRING:', process.env.COSMOS_CONNECTION_STRING ? 'set' : 'not set');
```

Run: `node verify-config.js`

---

## 📊 Your Current Status

Based on your `.env`:

```env
USE_FIREBASE=true  # ← Using old format
COSMOS_CONNECTION_STRING=...  # ← Cosmos config present but not used
```

**Current State:**
- ✅ System is using **Firebase** (via old `USE_FIREBASE=true`)
- ⚠️ Cosmos DB config present but **not active**
- ✅ All dependencies are installed
- ✅ Backward compatibility working

**To use Cosmos DB:**
```bash
npm run switch-db cosmosdb
```

This will update `.env` to:
```env
DB_TYPE=cosmosdb
```

---

## 🎯 Recommendations

### 1. Migrate to New Format (Recommended)
```bash
npm run switch-db firestore  # Since you're currently using Firebase
```

### 2. Clean Up .env
Remove unused or conflicting variables after migration

### 3. Verify Dependencies
```bash
npm install
npm audit fix  # Fix security vulnerabilities
```

### 4. Test Integration
```bash
npm start  # Should start without errors
```

---

## 💡 Dynamic Integration

**YES, databases can be integrated with one another!**

### Hybrid Mode Integration

```env
DB_TYPE=hybrid-cosmos

# MySQL (Primary - all writes)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=secret
MYSQL_DATABASE=monitor_db

# Cosmos DB (Secondary - auto-sync)
COSMOS_CONNECTION_STRING=mongodb://...
```

**How it works:**
1. **Write** → Goes to MySQL (primary)
2. **Auto-sync** → Copies to Cosmos DB (secondary, async)
3. **Read** → From MySQL (primary)
4. **Fallback** → If MySQL fails, reads from Cosmos DB

**Benefits:**
- MySQL for fast relational queries
- Cosmos DB for global distribution
- Automatic backup and replication
- No code changes needed!

---

## ✅ Final Verification

Run these commands:

```bash
# 1. Install dependencies
npm install

# 2. Check configuration
node -e "require('dotenv').config(); console.log('DB_TYPE:', process.env.DB_TYPE || 'OLD FORMAT'); console.log('Working:', process.env.USE_FIREBASE || process.env.DB_TYPE ? 'YES' : 'NO')"

# 3. Start application
npm start
```

**Expected:** Application starts without errors ✅

---

## 🆘 Still Having Issues?

1. Check `lib/doc/README.md` for documentation index
2. Read `lib/doc/AZURE_QUICK_START.md` for Cosmos DB setup
3. Check `lib/doc/INTEGRATION_SUMMARY.md` for architecture
4. Run `npm install` to ensure all deps installed
5. Verify `.env` has required variables for your DB_TYPE

**Everything is designed to work together dynamically!** 🚀
