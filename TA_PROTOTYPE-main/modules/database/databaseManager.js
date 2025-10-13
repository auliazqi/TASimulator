// modules/database/databaseManager.js - Enhanced with new database adapter
const FirebaseDB = require('../../lib/db/firebaseDB');
const Database = require('../../lib/db/mysqlDB');
const CosmosDB = require('../../lib/db/cosmosDB');
const { getInstance: getDatabaseAdapter } = require('../../lib/db/databaseAdapter');
const { apiKey } = require('../../firebaseConfig');
const alert = require('../../lib/alert');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbAdapter = null;
        this.dbType = process.env.DB_TYPE || 'mysql';

        // Legacy support for USE_FIREBASE env variable
        if (process.env.USE_FIREBASE === 'true' && !process.env.DB_TYPE) {
            this.dbType = 'firestore';
        }
    }

    async initialize() {
        try {
            alert.system.startup(`Database Manager (${this.dbType} mode)`);

            // NEW: Use enhanced database adapter for all supported types
            const supportedTypes = ['mysql', 'firestore', 'cosmosdb', 'hybrid', 'hybrid-cosmos'];

            if (supportedTypes.includes(this.dbType)) {
                this.dbAdapter = getDatabaseAdapter();
                await this.dbAdapter.initialize();
                this.db = this.dbAdapter; // Provide compatibility interface

                const config = this.dbAdapter.getConfig();
                alert.success('DATABASE', `${config.type} mode initialized successfully`);
                if (config.primaryDatabase) {
                    alert.info('DATABASE', `Primary: ${config.primaryDatabase}`);
                }
                if (config.secondaryDatabase) {
                    alert.info('DATABASE', `Secondary: ${config.secondaryDatabase} (auto-sync)`);
                }
                return;
            }

            // Fallback: Legacy single database initialization (backward compatibility)
            alert.warning('DATABASE', 'Using legacy database initialization. Consider using DB_TYPE env variable.');

            if (this.dbType === 'firebase' || this.dbType === 'firestore') {
                this.db = new FirebaseDB({
                    apiKey: process.env.FIREBASE_API_KEY || apiKey,
                    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'your-auth-domain',
                    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://your-database-url.firebaseio.com',
                    projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-storage-bucket',
                    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'your-messaging-sender-id',
                    appId: process.env.FIREBASE_APP_ID || 'your-app-id',
                    measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'your-measurement-id',
                    useFirestore: process.env.USE_FIRESTORE === 'true'
                });
                await this.db.connect();
            } else if (this.dbType === 'cosmosdb') {
                this.db = new CosmosDB({
                    connectionString: process.env.COSMOS_CONNECTION_STRING,
                    accountName: process.env.COSMOS_ACCOUNT_NAME,
                    accountKey: process.env.COSMOS_ACCOUNT_KEY,
                    database: process.env.COSMOS_DATABASE || 'monitor_db'
                });
                await this.db.connect();
            } else {
                this.db = new Database({
                    host: process.env.MYSQL_HOST || 'localhost',
                    user: process.env.MYSQL_USER || 'root',
                    password: process.env.MYSQL_PASSWORD || '',
                    database: process.env.MYSQL_DATABASE || 'monitor_db'
                });
                await this.db.connect();
            }

            alert.database.connected(this.dbType, 'Database layer ready');

        } catch (error) {
            alert.database.error('Database initialization', error);
            throw error;
        }
    }

    getDatabase() {
        return this.db;
    }

    // NEW: Get enhanced database adapter
    getDatabaseAdapter() {
        return this.dbAdapter;
    }

    // Get database configuration info
    getDatabaseInfo() {
        if (this.dbAdapter) {
            return this.dbAdapter.getConfig();
        }
        return {
            type: this.dbType,
            useFirestore: this.db?.isFirestore || false,
            useAdapter: !!this.dbAdapter
        };
    }

    async close() {
        if (this.db) {
            try {
                await this.db.close();
                alert.database.disconnected('Database Manager');
            } catch (error) {
                alert.database.error('Connection close', error);
                throw error;
            }
        }
    }

    isFirebase() {
        return this.dbType === 'firestore' || this.dbType === 'firebase';
    }

    isCosmos() {
        return this.dbType === 'cosmosdb' || this.dbType === 'hybrid-cosmos';
    }

    isMySQL() {
        return this.dbType === 'mysql' || this.dbType === 'hybrid' || this.dbType === 'hybrid-cosmos';
    }

    isHybrid() {
        return this.dbType === 'hybrid' || this.dbType === 'hybrid-cosmos';
    }

    // NEW: Get health check information
    async getHealthCheck() {
        if (this.dbAdapter && this.dbAdapter.healthCheck) {
            return await this.dbAdapter.healthCheck();
        }
        return { status: 'unknown', type: this.isFirebase() ? 'firebase' : 'mysql' };
    }
}

module.exports = DatabaseManager;