// lib/db/cosmosDB.js - Azure Cosmos DB Adapter (MongoDB API)
// Collection-based like Firebase, compatible with existing framework

const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const alert = require('../alert');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update(process.env.DB_ENCRYPTION_KEY || '').digest();
const IV_LENGTH = 16;

class CosmosQueryBuilder {
    constructor(database, collectionName) {
        this.database = database;
        this.collectionName = collectionName;
        this.filters = {};
        this.orderField = null;
        this.orderDirection = 1; // 1 for ASC, -1 for DESC
        this.limitCount = null;
        this.offsetCount = 0;
        this.selectFields = null;
    }

    // SELECT methods
    select(fields = '*') {
        if (Array.isArray(fields)) {
            this.selectFields = fields;
        } else if (typeof fields === 'string' && fields !== '*') {
            this.selectFields = fields.split(',').map(field => field.trim());
        }
        return this;
    }

    // WHERE methods
    where(field, operator = '=', value = null) {
        if (typeof field === 'object' && field !== null) {
            // Handle object syntax: where({name: 'John', age: 25})
            Object.assign(this.filters, field);
        } else if (arguments.length === 2) {
            // Handle where(field, value) syntax
            this.filters[field] = { operator: '=', value: operator };
        } else {
            // Handle where(field, operator, value) syntax
            this.filters[field] = { operator, value };
        }
        return this;
    }

    whereIn(field, values) {
        if (Array.isArray(values) && values.length > 0) {
            this.filters[field] = { operator: 'in', value: values };
        }
        return this;
    }

    whereNotIn(field, values) {
        if (Array.isArray(values) && values.length > 0) {
            this.filters[field] = { operator: 'not-in', value: values };
        }
        return this;
    }

    whereBetween(field, min, max) {
        this.filters[field] = { operator: 'between', value: [min, max] };
        return this;
    }

    whereNull(field) {
        this.filters[field] = { operator: 'null' };
        return this;
    }

    whereNotNull(field) {
        this.filters[field] = { operator: 'not-null' };
        return this;
    }

    whereLike(field, pattern) {
        this.filters[field] = { operator: 'like', value: pattern };
        return this;
    }

    orWhere(field, operator = '=', value = null) {
        if (!this.orConditions) this.orConditions = [];

        if (typeof field === 'object' && field !== null) {
            this.orConditions.push(field);
        } else if (arguments.length === 2) {
            this.orConditions.push({ [field]: { operator: '=', value: operator } });
        } else {
            this.orConditions.push({ [field]: { operator, value } });
        }
        return this;
    }

    // ORDER BY methods
    orderBy(field, direction = 'ASC') {
        this.orderField = field;
        this.orderDirection = direction.toUpperCase() === 'DESC' ? -1 : 1;
        return this;
    }

    orderByDesc(field) {
        return this.orderBy(field, 'DESC');
    }

    orderByAsc(field) {
        return this.orderBy(field, 'ASC');
    }

    // LIMIT methods
    limit(count, offset = null) {
        this.limitCount = count;
        if (offset !== null) {
            this.offsetCount = offset;
        }
        return this;
    }

    take(count) {
        return this.limit(count);
    }

    skip(offset) {
        this.offsetCount = offset;
        return this;
    }

    // Execution methods
    async get() {
        try {
            const collection = this.database.db.collection(this.collectionName);

            // Build MongoDB query from filters
            const query = this._buildMongoQuery();

            // Build projection for field selection
            const projection = this._buildProjection();

            // Build sort options
            const sort = this.orderField ? { [this.orderField]: this.orderDirection } : {};

            let cursor = collection.find(query);

            if (Object.keys(projection).length > 0) {
                cursor = cursor.project(projection);
            }

            if (Object.keys(sort).length > 0) {
                cursor = cursor.sort(sort);
            }

            if (this.offsetCount > 0) {
                cursor = cursor.skip(this.offsetCount);
            }

            if (this.limitCount) {
                cursor = cursor.limit(this.limitCount);
            }

            const results = await cursor.toArray();

            // Decrypt and format results
            return results.map(doc => {
                const decrypted = this.database._decryptRow(doc);
                return { id: doc._id.toString(), ...decrypted };
            });

        } catch (error) {
            alert.database.error('CosmosDB get operation', error);
            throw error;
        }
    }

    async first() {
        this.limit(1);
        const results = await this.get();
        return results.length > 0 ? results[0] : null;
    }

    async count(field = '*') {
        try {
            const collection = this.database.db.collection(this.collectionName);
            const query = this._buildMongoQuery();
            return await collection.countDocuments(query);
        } catch (error) {
            alert.database.error('CosmosDB count operation', error);
            throw error;
        }
    }

    async exists() {
        const count = await this.count();
        return count > 0;
    }

    async pluck(field) {
        this.select(field);
        const results = await this.get();
        return results.map(row => row[field]);
    }

    // UPDATE method
    async update(data) {
        if (Object.keys(data).length === 0) {
            throw new Error('No data provided for update');
        }

        try {
            const collection = this.database.db.collection(this.collectionName);
            const query = this._buildMongoQuery();
            const encryptedData = this.database._encryptData(data);

            // Add updated_at timestamp
            encryptedData.updated_at = new Date();

            const result = await collection.updateMany(query, { $set: encryptedData });
            return { affectedRows: result.modifiedCount };
        } catch (error) {
            alert.database.error('CosmosDB update operation', error);
            throw error;
        }
    }

    // DELETE method
    async delete() {
        try {
            const collection = this.database.db.collection(this.collectionName);
            const query = this._buildMongoQuery();

            const result = await collection.deleteMany(query);
            return { affectedRows: result.deletedCount };
        } catch (error) {
            alert.database.error('CosmosDB delete operation', error);
            throw error;
        }
    }

    // Helper: Build MongoDB query from filters
    _buildMongoQuery() {
        const mongoQuery = {};

        // Apply main filters
        for (const [field, condition] of Object.entries(this.filters)) {
            if (field === '_id') continue; // Skip _id in filters, handle separately

            if (typeof condition !== 'object' || condition === null) {
                mongoQuery[field] = condition;
                continue;
            }

            const { operator, value } = condition;

            switch (operator) {
                case '=':
                case '==':
                    mongoQuery[field] = value;
                    break;
                case '!=':
                case '<>':
                    mongoQuery[field] = { $ne: value };
                    break;
                case '>':
                    mongoQuery[field] = { $gt: value };
                    break;
                case '>=':
                    mongoQuery[field] = { $gte: value };
                    break;
                case '<':
                    mongoQuery[field] = { $lt: value };
                    break;
                case '<=':
                    mongoQuery[field] = { $lte: value };
                    break;
                case 'in':
                    mongoQuery[field] = { $in: value };
                    break;
                case 'not-in':
                    mongoQuery[field] = { $nin: value };
                    break;
                case 'between':
                    mongoQuery[field] = { $gte: value[0], $lte: value[1] };
                    break;
                case 'like':
                    const pattern = value.replace(/%/g, '.*').replace(/_/g, '.');
                    mongoQuery[field] = { $regex: pattern, $options: 'i' };
                    break;
                case 'null':
                    mongoQuery[field] = null;
                    break;
                case 'not-null':
                    mongoQuery[field] = { $ne: null };
                    break;
                default:
                    mongoQuery[field] = value;
            }
        }

        // Handle OR conditions
        if (this.orConditions && this.orConditions.length > 0) {
            const orQueries = this.orConditions.map(orCondition => {
                const orQuery = {};
                for (const [field, condition] of Object.entries(orCondition)) {
                    const { operator, value } = condition;
                    // Apply same logic as above for OR conditions
                    if (operator === '=') {
                        orQuery[field] = value;
                    } // ... add other operators as needed
                }
                return orQuery;
            });
            mongoQuery.$or = orQueries;
        }

        return mongoQuery;
    }

    // Helper: Build projection for field selection
    _buildProjection() {
        if (!this.selectFields || !Array.isArray(this.selectFields)) {
            return {};
        }

        const projection = {};
        this.selectFields.forEach(field => {
            projection[field] = 1;
        });
        return projection;
    }

    raw(query, params = []) {
        console.warn("Raw queries are not supported. Use MongoDB-specific methods instead.");
        return Promise.resolve([]);
    }
}

class CosmosDB {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            // Azure Cosmos DB MongoDB connection string format
            const connectionString = this.config.connectionString ||
                `mongodb://${this.config.accountName}:${this.config.accountKey}@${this.config.accountName}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@${this.config.accountName}@`;

            this.client = new MongoClient(connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });

            await this.client.connect();

            const dbName = this.config.database || process.env.COSMOS_DATABASE || 'monitor_db';
            this.db = this.client.db(dbName);

            this.isConnected = true;
            alert.database.connected('Azure Cosmos DB (MongoDB API)', dbName);
            alert.success('COSMOSDB', `Connected to database: ${dbName}`);

            return Promise.resolve();
        } catch (error) {
            alert.database.error('CosmosDB connection', error);
            throw error;
        }
    }

    // Chainable query builder
    table(collectionName) {
        return new CosmosQueryBuilder(this, collectionName);
    }

    from(collectionName) {
        return this.table(collectionName);
    }

    // Raw query method (MongoDB aggregation pipeline)
    async aggregate(collectionName, pipeline) {
        try {
            const collection = this.db.collection(collectionName);
            const results = await collection.aggregate(pipeline).toArray();
            return results;
        } catch (error) {
            alert.database.error('CosmosDB aggregate operation', error);
            throw error;
        }
    }

    // Validation method (same as Firebase/MySQL)
    validate(data, rules) {
        for (const [field, rule] of Object.entries(rules)) {
            if (rule.includes('required') && (data[field] === undefined || data[field] === null || data[field] === '')) {
                throw new Error(`${field} is required`);
            }
            if (rule.includes('email') && data[field] && !/^\S+@\S+\.\S+$/.test(data[field])) {
                throw new Error(`${field} must be a valid email`);
            }
        }
    }

    // Encryption methods (same as Firebase/MySQL)
    encrypt(text) {
        if (text === null || typeof text === 'undefined') return text;
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
        let encrypted = cipher.update(String(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText) {
        if (typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
            return encryptedText;
        }
        try {
            const textParts = encryptedText.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedData = textParts.join(':');
            const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            return encryptedText;
        }
    }

    _encryptData(data) {
        const encryptedData = {};
        for (const [key, value] of Object.entries(data)) {
            const sensitiveFields = ['password', 'email', 'phone', 'address', 'name'];
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                encryptedData[key] = this.encrypt(value);
            } else {
                encryptedData[key] = value;
            }
        }
        return encryptedData;
    }

    _decryptRow(row) {
        if (!row || typeof row !== 'object') return row;

        const decryptedRow = { ...row };
        for (const key in decryptedRow) {
            if (key === '_id') continue; // Skip MongoDB _id

            if (typeof decryptedRow[key] === 'string' && decryptedRow[key].includes(':')) {
                const originalValue = decryptedRow[key];
                decryptedRow[key] = this.decrypt(originalValue);
                if (decryptedRow[key] !== originalValue && !isNaN(Number(decryptedRow[key]))) {
                    decryptedRow[key] = Number(decryptedRow[key]);
                }
            }
        }
        return decryptedRow;
    }

    // Legacy methods for backward compatibility with existing framework
    async postData(collectionName, data = {}) {
        try {
            const collection = this.db.collection(collectionName);
            const encryptedData = this._encryptData(data);

            // Add timestamps
            encryptedData.created_at = new Date();
            encryptedData.updated_at = new Date();

            const result = await collection.insertOne(encryptedData);
            return {
                insertId: result.insertedId.toString(),
                affectedRows: 1
            };
        } catch (error) {
            alert.database.error('CosmosDB postData operation', error);
            throw error;
        }
    }

    async updateData(collectionName, data = {}, whereClause = '', whereParams = []) {
        try {
            const filters = this._parseWhereClause(whereClause, whereParams);
            return await this.table(collectionName)
                .where(filters)
                .update(data);
        } catch (error) {
            alert.database.error('CosmosDB updateData operation', error);
            throw error;
        }
    }

    async deleteData(collectionName, whereClause = '', whereParams = []) {
        try {
            const filters = this._parseWhereClause(whereClause, whereParams);
            return await this.table(collectionName)
                .where(filters)
                .delete();
        } catch (error) {
            alert.database.error('CosmosDB deleteData operation', error);
            throw error;
        }
    }

    async getDataByFilters(collectionName, filters = {}, options = {}) {
        try {
            let query = this.table(collectionName);

            // Apply filters
            if (Object.keys(filters).length > 0) {
                query = query.where(filters);
            }

            // Apply ordering
            if (options.orderBy) {
                if (typeof options.orderBy === 'string') {
                    const parts = options.orderBy.trim().split(/\s+/);
                    const column = parts[0];
                    const direction = parts[1] || 'DESC';
                    query = query.orderBy(column, direction);
                } else if (options.orderBy.column) {
                    const direction = options.orderBy.direction || 'DESC';
                    query = query.orderBy(options.orderBy.column, direction);
                }
            }

            // Apply limit
            if (options.limit && Number.isInteger(options.limit) && options.limit > 0) {
                query = query.limit(options.limit);
            }

            return await query.get();
        } catch (error) {
            alert.database.error('CosmosDB getDataByFilters operation', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            return await this.table('users').get();
        } catch (error) {
            alert.database.error('CosmosDB getAllUsers operation', error);
            throw error;
        }
    }

    async insertUser(name, email) {
        try {
            return await this.postData('users', { name, email });
        } catch (error) {
            alert.database.error('CosmosDB insertUser operation', error);
            throw error;
        }
    }

    // Helper: Parse MySQL-style WHERE clauses
    _parseWhereClause(whereClause, whereParams = []) {
        if (!whereClause) return {};

        const filters = {};
        let paramIndex = 0;

        const conditions = whereClause.split(' AND ');

        conditions.forEach(condition => {
            const match = condition.match(/`?(\w+)`?\s*(=|!=|>|>=|<|<=|LIKE)\s*\?/i);
            if (match && paramIndex < whereParams.length) {
                const field = match[1];
                const operator = match[2].toLowerCase();
                const value = whereParams[paramIndex++];

                filters[field] = { operator, value };
            }
        });

        return filters;
    }

    // Change streams (similar to Firebase subscriptions)
    async subscribe(collectionName, callback, filters = {}) {
        try {
            const collection = this.db.collection(collectionName);
            const changeStream = collection.watch();

            changeStream.on('change', (change) => {
                const decryptedData = this._decryptRow(change.fullDocument || {});
                callback({
                    type: change.operationType, // 'insert', 'update', 'delete', etc.
                    id: change.documentKey._id.toString(),
                    data: decryptedData,
                    collection: collectionName
                });
            });

            changeStream.on('error', (error) => {
                alert.database.error(`CosmosDB change stream for ${collectionName}`, error);
                callback({
                    type: 'error',
                    error: error.message,
                    collection: collectionName
                });
            });

            // Return unsubscribe function
            return () => {
                changeStream.close();
                alert.info('COSMOSDB', `Change stream closed for ${collectionName}`);
            };
        } catch (error) {
            alert.database.error('CosmosDB subscribe operation', error);
            return () => {}; // Return empty unsubscribe
        }
    }

    async close() {
        try {
            if (this.client && this.isConnected) {
                await this.client.close();
                this.isConnected = false;
                alert.database.disconnected('Azure Cosmos DB');
            }
        } catch (error) {
            alert.database.error('CosmosDB connection close', error);
        }
        return Promise.resolve();
    }

    check_up(data) {
        if (!data) {
            return { success: false, error: "Database not initialized for controller." };
        }
    }

    // CosmosDB-specific methods
    async query(sql, params = []) {
        console.warn("SQL queries not supported. Use MongoDB-style queries or table() methods.");
        return [];
    }
}

module.exports = CosmosDB;