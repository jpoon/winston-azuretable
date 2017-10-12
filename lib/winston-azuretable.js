const util    = require('util'),
      azure   = require('azure-storage'),
      winston = require('winston');
      entGen = azure.TableUtilities.entityGenerator;

// constant
var DEFAULT_TABLE_NAME = 'log';
var DEFAULT_IS_SILENT = false;
var DEFAULT_NESTED_META = false;
var WINSTON_LOGGER_NAME = 'azurelogger';
var WINSTON_DEFAULT_LEVEL = 'info';
var DATE_MAX = new Date(3000, 1);

//
// ### function AzureLogger (options)
// #### @options {Object} Options for this instance.
// Constructor function for the AzureLogger transport object responsible
// for persisting log messages and metadata to Azure Table Storage.
//
var AzureLogger = exports.AzureLogger = function (options) {
    winston.Transport.call(this, options);

    var account = options.account || process.env.AZURE_STORAGE_ACCOUNT,
        key = options.key || process.env.AZURE_STORAGE_ACCESS_KEY,
        self = this;

    if (options.useDevStorage !== true) {
        if (!account) {
            throw new Error('azure storage account name required.');
        }

        if (!key) {
            throw new Error('azure storage account key required.');
        }
    }

    this.name = WINSTON_LOGGER_NAME;
    this.level = options.level || WINSTON_DEFAULT_LEVEL;
    this.partitionKey = options.partitionKey || process.env.NODE_ENV || 'unknown';
    this.tableName = options.tableName || DEFAULT_TABLE_NAME;
    this.silent = options.silent || DEFAULT_IS_SILENT;
    this.nestedMeta = options.nestedMeta || DEFAULT_NESTED_META;

    this.tableService = options.useDevStorage ? 
        azure.createTableService('UseDevelopmentStorage=true') : 
        azure.createTableService(account, key);

    this.tableService.createTableIfNotExists(this.tableName, function(err) {
        if (err) {
            self.emit('error', err);
        }

        if (options.callback) {
            options.callback(); 
        }
    });
};

//
// Inherits from 'winston.Transport'.
//
util.inherits(AzureLogger, winston.Transport);

//
// Define a getter so that 'winston.transport.AzureLogger'
// is available and thus backwards compatible
//
winston.transports.AzureLogger = AzureLogger;

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
AzureLogger.prototype.log = function (level, msg, meta, callback) {
    var self = this;

    if (typeof meta === 'function') {
        callback = meta;
        meta = {};
    }

    callback = callback || function(){};

    if (this.silent) {
        return callback(null, true);
    }

    var data = {
        PartitionKey: entGen.String(this.partitionKey),
        RowKey: entGen.String((DATE_MAX - Date.now()).toString()),
        hostname: entGen.String(require('os').hostname()),
        pid: entGen.Int32(process.pid),
        level: entGen.String(level),
        msg: entGen.String(msg),
        createdDateTime: entGen.DateTime(new Date()),
    };

    if (meta) {
        if (this.nestedMeta) {
            data.meta = entGen.String(JSON.stringify(meta));
        } else {
            for (var prop in meta) {
                var propertyName = prop + '_';
                if (typeof meta[prop] === 'object') {
                    data[propertyName] = entGen.String(JSON.stringify(meta[prop]));
                } else {
                    data[propertyName] = entGen.String(meta[prop]);
                }
            }
        }
    }

    this.tableService.insertEntity(this.tableName, data, function(err) {
        if (err) {
            return callback(err);
        }

        self.emit('logged');
        return callback(null, true);
    });
}; 

//
// ### function query (options, callback)
// #### @options {Object} Loggly-like query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport. Options object is optional.
//
AzureLogger.prototype.query = function (options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    var self = this;
    options = this.normalizeQuery(options);

    // ToDo: handle pagination
    var query = new azure.TableQuery()
                    .where('PartitionKey eq ?', self.partitionKey)
                    .and('RowKey le ?', (DATE_MAX - options.from.getTime()).toString())
                    .and('RowKey ge ?', (DATE_MAX - options.until.getTime()).toString())
                    .top(options.rows);

    this.tableService.queryEntities(self.tableName, query, null, function(queryError, queryResult, queryResponse) {
        if (queryError) { 
            return callback(queryError);
        }

        var entityResult = [],
            entities = queryResult.entries;

        for (var i = 0; i < entities.length; i++) {
            var entity = {};
            for (var key in entities[i]) {
                if (key === '.metadata') {
                    continue;
                }

                if (options.fields) {
                    if (options.fields.indexOf(key) === -1) {
                        continue;
                    }
                }

                entity[key] = entities[i][key]._;
            }

            entityResult.push(entity);
        }

        if (options.order !== 'desc') {
            entityResult = entityResult.reverse();
        }

        return callback(null, entityResult);
    });
};
