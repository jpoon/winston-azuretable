/* jshint expr:true */

var expect = require('chai').expect,
    chai = require('chai'),
    azure = require('azure'),
    winston = require('winston'),
    azureLogger = require("../lib/winston-azuretable.js").AzureLogger;

describe('azure logger', function() {
    var _tableService = azure.createTableService('UseDevelopmentStorage=true');

    afterEach(function(done) {
        _tableService.listTablesSegmented(null, function(error, result, response) {
            expect(error).to.be.null;

            if (result.entries && result.entries.length > 0) {
                var deleteTableCallback = function(error) { 
                    expect(error).to.be.null;
                    done();
                };

                for (var index = 0; index < result.entries.length; index++) {
                    var tableName = result.entries[index];
                    _tableService.deleteTableIfExists(tableName, deleteTableCallback);
                }
            } else {
                done();
            }
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

                    logger.log(expectedLevel, expectedMsg, { propName1: 'propValue1', propName2: 'propValue2' }, function(error) {
                        expect(error).to.be.null;

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
                            var actualPropName1 = result.entries[0].propName1._;
                            var actualPropName2 = result.entries[0].propName2._;

                            expect(actualPartitionKey).to.be.equal(expectedPartitionKey);
                            expect(actualHostname).to.not.be.empty;
                            expect(actualPid).to.not.be.empty;
                            expect(actualLevel).to.be.equal(expectedLevel);
                            expect(actualMsg).to.be.equal(expectedMsg);
                            expect(actualPropName1).to.be.equal('propValue1');
                            expect(actualPropName2).to.be.equal('propValue2');
                            done();
                        });
                    });
                }
            });
        });
    });

    describe('query', function() {
        var logger;

        beforeEach(function(done) {
            logger = new winston.transports.AzureLogger({
                useDevStorage: true,
                callback: function() {
                    done();
                }
            });
        });

        it('happy path', function(done) {
            var expectedLevel = Math.random().toString(36).replace(/[^a-z]+/g, '');
            var expectedMsg = Math.random().toString(36).replace(/[^a-z]+/g, '');

            logger.log(expectedLevel, expectedMsg, function(error) {
                expect(error).to.be.null;

                logger.query(null, function(error, result) {
                    expect(error).to.be.null;
                    expect(result).to.have.length('1');
                    expect(result[0].level).to.be.equal(expectedLevel);
                    expect(result[0].msg).to.be.equal(expectedMsg);
                    done();
                });
            });
        });

        it('expectedFields', function(done) {
            var expectedMsg = Math.random().toString(36).replace(/[^a-z]+/g, '');

            logger.log(null, expectedMsg, function(error) {
                expect(error).to.be.null;

                var options = {
                    fields: ['msg']
                };

                logger.query(options, function(error, result) {
                    expect(error).to.be.null;
                    expect(result).to.have.length('1');
                    expect(Object.keys(result[0])).to.have.length('1');
                    expect(result[0].msg).to.be.equal(expectedMsg);
                    done();
                });
            });
        });

    });
});
