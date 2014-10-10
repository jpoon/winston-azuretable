var expect = require('chai').expect,
    chai = require('chai'),
    azure = require('azure'),
    winston = require('winston'),
    azureLogger = require("../lib/winston-azuretable.js").AzureLogger;

describe('azure logger', function() {
    var _tableService = azure.createTableService('UseDevelopmentStorage=true');

    beforeEach(function(done) {
        _tableService.listTablesSegmented(null, function(error, result, response) {
            if (result.entries) {

                var handleError = function(error) { 
                    if (error) {
                        console.log('Deleting Table Error: ' + error);
                    }
                };

                for (var index = 0; index < result.entries.length; index++) {
                    var tableName = result.entries[index];
                    _tableService.deleteTableIfExists(tableName, handleError);
                }
            }

            done();
        });
    });

    describe('ctor', function() {
        it('storage name required', function() {
            expect(function() {
                new winston.transports.AzureLogger({});
            }).to.throw('azure storage account name required.');
        });

        it('storage key required', function() {
            expect(function() {
                new winston.transports.AzureLogger({
                    account: 'some account'
                });
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
            var expectedTableName = 'testTable';
            var expectedPartitionKey = 'testPartitionKey';
            var expectedLevel = Math.random().toString(36).replace(/[^a-z]+/g, '');
            var expectedMsg = Math.random().toString(36).replace(/[^a-z]+/g, '');

            var logger = new winston.transports.AzureLogger({
                useDevStorage: true,
                tableName: expectedTableName,
                partitionKey: expectedPartitionKey,
                callback: function() {

                    logger.log(expectedLevel, expectedMsg, { propName1: 'propValue1', propName2: 'propValue2' }, function() {
                        var query = new azure.TableQuery()
                                             .where('PartitionKey eq ?', expectedPartitionKey);

                        _tableService.queryEntities(expectedTableName, query, null, function(error, result, response) {
                            expect(result.entries).to.have.length('1');

                            var actualPartitionKey = result.entries[0].PartitionKey._;
                            var actualHostname = result.entries[0].hostname._;
                            var actualPid = result.entries[0].pid._;
                            var actualLevel = result.entries[0].level._;
                            var actualMsg = result.entries[0].msg._;
                            var actualCreatedDatetime = result.entries[0].createdDateTime._;

                            expect(actualPartitionKey).to.be.equal(expectedPartitionKey);
                            expect(actualHostname).to.not.be.empty;
                            expect(actualPid).to.not.be.empty;
                            expect(actualLevel).to.not.be.empty;
                            expect(actualMsg).to.be.equal(expectedMsg);
                            expect(actualMsg).to.not.be.empty;
                            done();
                        });
                    });
                }
            });
       });
    });
});
