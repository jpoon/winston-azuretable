var util    = require('util'),
    azure   = require('azure'),
    winston = require('winston');

// constant
var DEFAULT_TABLE_NAME = 'log';
var DEFAULT_IS_SILENT = false;
var WINSTON_LOGGER_NAME = 'azurelogger';
var WINSTON_DEFAULT_LEVEL = 'info';

//
// ### function AzureLogger (options)
// #### @options {Object} Options for this instance.
// Constructor function for the AzureLogger transport object responsible
// for persisting log messages and metadata to Azure Table Storage.
//
var AzureLogger = exports.AzureLogger = function (options) {
    winston.Transport.call(this, options);

    if (options.useDevStorage !== true) {
        if (!options.account) {
            throw new Error('azure storage account name required.');
        }

        if (!options.key) {
            throw new Error('azure storage account key required.');
        }
    }

    var self = this;

    this.name = WINSTON_LOGGER_NAME;
    this.level = options.level || WINSTON_DEFAULT_LEVEL;
    this.partitionKey = options.partitionKey || process.env.NODE_ENV || 'unknown';
    this.tableName = options.tableName || DEFAULT_TABLE_NAME;
    this.silent = options.silent || DEFAULT_IS_SILENT;

    this.tableService = options.useDevStorage ? 
        azure.createTableService('UseDevelopmentStorage=true') : 
        azure.createTableService(options.account, options.key);

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
    if (this.silent) {
        callback(null, true);
        return;
    }

    var self = this,
        hostname = require('os').hostname().toString();

    var data = {
        'PartitionKey': { '_': this.partitionKey },
        'RowKey': { '_': Date.now().toString() },
        'hostname': { '_': hostname },
        'pid': { '_': process.pid },
        'level': { '_': this.level },
        'msg': { '_': msg },
        'createdDateTime': {'_': new Date(), '$':'Edm.DateTime' }
    };

    if (meta) { 
        for (var prop in meta) {
            if (typeof meta[prop] === 'object') {
                data[prop] = JSON.stringify(meta[prop]);
            } else {
                data[prop] = meta[prop];
            }
         }
    }

    this.tableService.insertEntity(this.tableName, data, function(err) {
        if (err) {
            self.emit('error', err);
        }

        self.emit('logged', data);

        callback(null, true);
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

    var self = this,
        options = this.normalizeQuery(options);

    // options
    // (paging) rows, start
    var query = azure.TableQuery.select()
                     .from(self.tableName)
                     .where('PartitionKey eq ?', process.env.NODE_ENV)
                     .includeTotalCount()
                     .and('RowKey gt ?', options.from)
                     .and('RowKey le ?', options.until)
                     .top(options.rows);


    var continuation;
    if (continuation) {
        query.whereNextKeys(continuation.nextPartitionKey, continuation.nextRowKey);
    }

    this.tableService.queryEntities(query, function(err, result, continuation, response) {
        if (err) { 
            return callback(err);
        }

        entities = entities.map(function (data) {
            var log;

            try {
                log = JSON.parse(data);
            } catch (e) {
                return;
            }

            if (typeof log !== 'object' || !log) {
                return;
            }

            if (options.fields) {
                obj = {};
                options.fields.forEach(function (key) {
                    obj[key] = log[key];
                });
                log = obj;
            }

            if (options.order !== 'desc') {
                log= log.reverse();
            }

            return log;

        }).filter(Boolean);

        callback(null, entities);
    });
};
