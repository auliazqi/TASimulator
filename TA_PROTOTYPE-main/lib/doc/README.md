# Monitor Framework - Documentation Index

Welcome to the Monitor Framework documentation! All technical documentation is organized here.

## 📚 Documentation Structure

### 🗄️ Database Documentation

#### Core Database Libraries
- **[DATABASE_DOCUMENTATION.md](./DATABASE_DOCUMENTATION.md)** - MySQL database operations, query builder, validation, encryption
- **[FIREBASE_DOCUMENTATION.md](./FIREBASE_DOCUMENTATION.md)** - Firebase/Firestore integration guide

#### Azure Cosmos DB Integration (NEW!)
- **[AZURE_QUICK_START.md](./AZURE_QUICK_START.md)** - ⭐ START HERE: 3-step Cosmos DB setup
- **[COSMOS_DB_REFERENCE.md](./COSMOS_DB_REFERENCE.md)** - Quick reference card for Cosmos DB
- **[AZURE_INTEGRATION.md](./AZURE_INTEGRATION.md)** - Complete Cosmos DB integration guide
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Full module integration explanation
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Visual architecture diagrams

#### Configuration & Validation
- **[CONFIGURATION_COMPATIBILITY.md](./CONFIGURATION_COMPATIBILITY.md)** - ⚙️ Config issues, fixes, and compatibility
- **[DEPENDENCY_VALIDATION.md](./DEPENDENCY_VALIDATION.md)** - ✅ Dependency audit and integration validation

### 📡 Communication Documentation
- **[SERIAL_DOCUMENTATION.md](./SERIAL_DOCUMENTATION.md)** - Serial/hardware communication setup and troubleshooting
- **[WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)** - WebSocket real-time communication guide

## 🚀 Quick Start Guides

### For Database Setup
1. **MySQL** → Read `DATABASE_DOCUMENTATION.md`
2. **Firebase** → Read `FIREBASE_DOCUMENTATION.md`
3. **Azure Cosmos DB** → Read `AZURE_QUICK_START.md` (3-step setup)

### For Hardware Communication
1. **Serial Devices** → Read `SERIAL_DOCUMENTATION.md`
2. **Real-time WebSocket** → Read `WEBSOCKET_DOCUMENTATION.md`

## 🎯 Common Use Cases

### "I want to use Azure Cosmos DB"
1. Read: `AZURE_QUICK_START.md` (setup)
2. Reference: `COSMOS_DB_REFERENCE.md` (API usage)
3. Deep dive: `AZURE_INTEGRATION.md` (advanced features)

### "I need to understand the architecture"
1. Read: `INTEGRATION_SUMMARY.md` (module integration)
2. Visual: `ARCHITECTURE_DIAGRAM.md` (diagrams)

### "I'm connecting a serial device"
1. Read: `SERIAL_DOCUMENTATION.md`
2. Troubleshoot issues in the same doc

### "I need real-time data streaming"
1. Read: `WEBSOCKET_DOCUMENTATION.md`

## 📖 Documentation Categories

### By Technology
- **MySQL**: `DATABASE_DOCUMENTATION.md`
- **Firebase**: `FIREBASE_DOCUMENTATION.md`
- **Azure Cosmos DB**: `AZURE_*.md`, `COSMOS_*.md`, `INTEGRATION_*.md`, `ARCHITECTURE_*.md`
- **Serial/Hardware**: `SERIAL_DOCUMENTATION.md`
- **WebSocket**: `WEBSOCKET_DOCUMENTATION.md`

### By Task
- **Database Operations**: `DATABASE_DOCUMENTATION.md`
- **Cloud Integration**: `FIREBASE_DOCUMENTATION.md`, `AZURE_INTEGRATION.md`
- **Hardware Communication**: `SERIAL_DOCUMENTATION.md`
- **Real-time Features**: `WEBSOCKET_DOCUMENTATION.md`
- **Architecture Understanding**: `INTEGRATION_SUMMARY.md`, `ARCHITECTURE_DIAGRAM.md`

## 🔍 Finding What You Need

### Quick Reference Cards
- `COSMOS_DB_REFERENCE.md` - Azure Cosmos DB API and commands
- `AZURE_QUICK_START.md` - 3-step setup guide

### Complete Guides
- `DATABASE_DOCUMENTATION.md` - MySQL complete guide
- `FIREBASE_DOCUMENTATION.md` - Firebase complete guide
- `AZURE_INTEGRATION.md` - Cosmos DB complete guide
- `SERIAL_DOCUMENTATION.md` - Serial communication complete guide
- `WEBSOCKET_DOCUMENTATION.md` - WebSocket complete guide

### Architecture & Integration
- `INTEGRATION_SUMMARY.md` - How everything connects
- `ARCHITECTURE_DIAGRAM.md` - Visual flow diagrams

## 📋 Azure Cosmos DB Documentation Overview

Azure Cosmos DB is a new addition that provides collection-based database similar to Firebase:

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `AZURE_QUICK_START.md` | 3-step setup | First time setup |
| `COSMOS_DB_REFERENCE.md` | API reference | Daily development |
| `AZURE_INTEGRATION.md` | Complete guide | Advanced features |
| `INTEGRATION_SUMMARY.md` | Module integration | Understanding architecture |
| `ARCHITECTURE_DIAGRAM.md` | Visual diagrams | Understanding flow |

## 🛠️ By Development Phase

### Phase 1: Setup
1. Database choice:
   - MySQL → `DATABASE_DOCUMENTATION.md`
   - Firebase → `FIREBASE_DOCUMENTATION.md`
   - Cosmos DB → `AZURE_QUICK_START.md`

### Phase 2: Development
1. Database operations → Respective database doc
2. Hardware integration → `SERIAL_DOCUMENTATION.md`
3. Real-time features → `WEBSOCKET_DOCUMENTATION.md`

### Phase 3: Advanced
1. Architecture understanding → `INTEGRATION_SUMMARY.md`, `ARCHITECTURE_DIAGRAM.md`
2. Hybrid databases → `AZURE_INTEGRATION.md` (hybrid modes section)

## 📌 Key Concepts

### Database Adapter Pattern
The framework uses a unified database adapter supporting:
- MySQL (relational)
- Firebase/Firestore (NoSQL collection-based)
- Azure Cosmos DB (NoSQL collection-based, MongoDB API)
- Hybrid modes (primary + secondary with auto-sync)

**All databases use the same API!** See any database doc for API reference.

### Module Architecture
```
DatabaseManager (modules/database/)
    ↓
DatabaseAdapter (lib/db/) - Singleton
    ↓
Specific Driver (mysqlDB / firebaseDB / cosmosDB)
```

See `INTEGRATION_SUMMARY.md` and `ARCHITECTURE_DIAGRAM.md` for details.

## 💡 Tips

1. **Start with Quick Start guides** for setup
2. **Use Reference cards** for daily development
3. **Read Complete guides** for advanced features
4. **Check Architecture docs** to understand the system

## 🔗 External Resources

- Main README: `../../README.md` (project overview)
- CLAUDE.md: `../../CLAUDE.md` (Claude Code assistant guide)
- Environment Config: `../../.env.example` (configuration template)

## 📝 Contributing to Documentation

When adding new features:
1. Place documentation in `lib/doc/`
2. Update this README.md index
3. Update `../../CLAUDE.md` if needed
4. Follow the existing documentation format

---

**Need help? Start with the Quick Start guides or reference cards!** 🚀
