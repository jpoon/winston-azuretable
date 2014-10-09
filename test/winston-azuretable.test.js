var expect = require('chai').expect;
var chai = require('chai');
var azure = require('azure');
var winston = require('winston');
var azureLogger = require("../lib/winston-azuretable.js").AzureLogger;

describe('azure logger', function() {
    var _tableService = azure.createTableService('UseDevelopmentStorage=true');

    beforeEach(function(done) {
        _tableService.listTablesSegmented(null, function(error, result, response) {
            if (result.entries) {
                for (var index = 0; index < result.entries.length; index++) {
                    var tableName = result.entries[index];
                    _tableService.deleteTableIfExists(tableName, function(error) {
                        if (error) {
                            console.log('Deleting Table Error: ' + error);
                        }
                    });
                }
            }

            done();
        })
    })

    describe('ctor', function() {
        it('storage name required', function() {
            expect(function() {
                new winston.transports.AzureLogger({})
            }).to.throw('azure storage account name required.');
        });

        it('storage key required', function() {
            expect(function() {
                new winston.transports.AzureLogger({
                    account: 'some account'
                })
            }).to.throw('azure storage account key required.');
        });

        it('happy path', function(done) {
            var tableName = 'azureLoggerCtorHappyPath';

            var logger = new winston.transports.AzureLogger({
                useDevStorage: true,
                tableName: tableName,
                callback: function() { 
                    _tableService.listTablesSegmented(null, function(error, result, response) {
                        expect(result.entries).to.have.length('1');
                        expect(result.entries).to.include(tableName);
                    });

                    done(); 
                }
            });

        });
    });

    describe('log', function() {
        it('happy path', function(done) {
            var tableName = 'testTable';
            var partitionKey = 'testPartitionKey';

            var logger = new winston.transports.AzureLogger({
                useDevStorage: true,
                tableName: tableName,
                partitionKey: partitionKey,
                callback: function() {

                    var msg = Math.random().toString(36).replace(/[^a-z]+/g, '');
                    logger.log('testLevel', msg, '', function() {
                        var query = new azure.TableQuery()
                                             .where('PartitionKey eq ?', partitionKey);

                        _tableService.queryEntities(tableName, query, null, function(error, result, response) {
                            expect(result.entries).to.have.length('1');
                            console.log(result.entries);
                            done();
                        });
                    })
                }
            });
       });
    });
});
