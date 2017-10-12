/* jshint expr:true */

const expect = require('chai').expect,
      chai = require('chai'),
      azure = require('azure-storage'),
      winston = require('winston'),
      azureLogger = require("../lib/winston-azuretable.js").AzureLogger;

chai.config.includeStack = true;

const account_name = '';
const account_key = '';
const useDevStorage = (!account_name && !account_key) ? true : false;

describe('azure logger', function() {
    let _tableService = azure.createTableService('UseDevelopmentStorage=true');
    if (account_name && account_key) {
        _tableService = azure.createTableService(account_name, account_key);
    }

    afterEach(done => {
        var deleteTable = function(tableService, tableName) {
            return new Promise((resolve, reject) => {
                tableService.deleteTableIfExists(tableName, error => {
                    if (error) {
                        reject(error);
                    }
                    resolve();
                });
            });
        };

        _tableService.listTablesSegmented(null, (error, result, response) => {
            expect(error).to.be.null;

            if (result.entries && result.entries.length > 0) {
                let list = [];
                for (var index = 0; index < result.entries.length; index++) {
                    var tableName = result.entries[index];
                    list.push(deleteTable(_tableService, tableName));
                }

                Promise.all(list).then(done());
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
            var tableName = 'test' + Math.random().toString(36).substring(2, 15);
            var logger = new winston.transports.AzureLogger({
                useDevStorage: useDevStorage,
                account: account_name,
                key: account_key, 
                tableName: tableName,
                callback: function() { 
                    _tableService.listTablesSegmented(null, function(error, result, response) {
                        expect(result.entries).to.include(tableName);
                    });
                    done(); 
                }
            });

        });
    });

    describe('log', function() {
        it('happy path', function(done) {
            var expectedTableName = 'test' + Math.random().toString(36).substring(2, 15);
            var expectedPartitionKey = 'testPartitionKey';
            var expectedLevel = Math.random().toString(36).replace(/[^a-z]+/g, '');
            var expectedMsg = Math.random().toString(36).replace(/[^a-z]+/g, '');

            var logger = new winston.transports.AzureLogger({
                useDevStorage: useDevStorage,
                account: account_name,
                key: account_key, 
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
                            var actualPropName1 = result.entries[0].propName1_._;
                            var actualPropName2 = result.entries[0].propName2_._;

                            expect(actualPartitionKey).to.equal(expectedPartitionKey);
                            expect(actualHostname).to.exist;
                            expect(actualPid).to.exist;
                            expect(actualLevel).to.equal(expectedLevel);
                            expect(actualMsg).to.equal(expectedMsg);
                            expect(actualPropName1).to.equal('propValue1');
                            expect(actualPropName2).to.equal('propValue2');
                            done();
                        });
                    });
                }
            });
        });

        it('nested metadata', function(done) {
            var tableName = 'test' + Math.random().toString(36).substring(2, 15);
            var partitionKey = 'testPartitionKey';
            var level = 'info';
            var msg = 'testing';
            var expectedMeta = {
                propName1: 'propValue1',
                propName2: 'propValue2'
            };

            var logger = new winston.transports.AzureLogger({
                useDevStorage: useDevStorage,
                account: account_name,
                key: account_key, 
                tableName: tableName,
                partitionKey: partitionKey,
                nestedMeta: true,
                callback: function() {

                    logger.log(level, msg, expectedMeta, function(error) {
                        expect(error).to.be.null;

                        var query = new azure.TableQuery()
                                             .where('PartitionKey eq ?', partitionKey);

                        _tableService.queryEntities(tableName, query, null, function(error, result, response) {
                            expect(result.entries).to.have.length('1');

                            var actualMeta = JSON.parse(result.entries[0].meta._);
                            var actualPropValue1 = actualMeta.propName1;
                            var actualPropValue2 = actualMeta.propName2;

                            expect(actualPropValue1).to.equal('propValue1');
                            expect(actualPropValue2).to.equal('propValue2');
                            done();
                        });
                    });
                }
            });
        });
    });
/*
    describe('query', function() {
        it('happy path', function (done) {
            var tableName = Math.random().toString(36).slice(2);

            var logger = new winston.transports.AzureLogger({
                useDevStorage: useDevStorage,
                account: account_name,
                key: account_key,
                tableName: tableName,
                callback: function () {
                    done();
                }
            });

            var expectedLevel = Math.random().toString(36).replace(/[^a-z]+/g, '');
            var expectedMsg = Math.random().toString(36).replace(/[^a-z]+/g, '');

            logger.log(expectedLevel, expectedMsg, function (error) {
                expect(error).to.be.null;

                logger.query(null, function (error, result) {
                    expect(error).to.be.null;
                    expect(result).to.have.length('1');
                    expect(result[0].level).to.be.equal(expectedLevel);
                    expect(result[0].msg).to.be.equal(expectedMsg);
                    done();
                });
            });
        });

        it('expectedFields', function (done) {
            var tableName = Math.random().toString(36).slice(2);

            var logger = new winston.transports.AzureLogger({
                useDevStorage: useDevStorage,
                account: account_name,
                key: account_key,
                tableName: tableName,
                callback: function () {
                    done();
                }
            });

            var expectedMsg = Math.random().toString(36).replace(/[^a-z]+/g, '');

            logger.log(null, expectedMsg, function (error) {
                expect(error).to.be.null;

                var options = {
                    fields: ['msg']
                };

                logger.query(options, function (error, result) {
                    expect(error).to.be.null;
                    expect(result).to.have.length('1');
                    expect(Object.keys(result[0])).to.have.length('1');
                    expect(result[0].msg).to.be.equal(expectedMsg);
                    done();
                });
            });
        });
    });
    */
});
