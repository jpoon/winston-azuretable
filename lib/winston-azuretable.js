var util    = require('util'),
    azure   = require('azure'),
    winston = require('winston');

// constant
var DEFAULT_TABLE_NAME = 'log';

var WINSTON_LOGGER_NAME = 'azurelogger';
var WINSTON_DEFAULT_LEVEL = 'info';

var AzureLogger = exports.AzureLogger = function (options) {
    winston.Transport.call(this, options);

    if (!options.account) {
        throw new Error('azure storage account name required.');
    }

    if (!options.key) {
        throw new Error('azure storage account key required.');
    }

    var self = this;

    this.name = WINSTON_LOGGER_NAME;
    this.level = options.level || WINSTON_DEFAULT_LEVEL;

    this.tableName = options.table || DEFAULT_TABLE_NAME;
    this.silent = options.silent || false;

    this.tableService = azure.createTableService(options.account, options.key);
    this.tableService.createTableIfNotExists(this.tableName, function(err) {
        if (err) {
            self.emit('error', err);
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

    if (this.silent) {
        return callback(null, true);
    }

    var data = {
        //'PartitionKey': require('os').hostname().toString(),
        'PartitionKey': 'test', 
        'RowKey': Date.now().toString(),
        'hostname': require('os').hostname().toString(),
        'pid': process.pid,
        'level': level,
        'msg': msg,
        'environment': process.env.NODE_ENV
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
    });

    callback(null,true);
}; 
