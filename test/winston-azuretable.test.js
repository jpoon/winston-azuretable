var expect = require('chai').expect;
var chai = require('chai');

var azure = require('azure');
var winston = require('winston');
var azureLogger = require("../lib/winston-azuretable.js").AzureLogger;

describe('azure logger', function() {
    var _tableService = azure.createTableService('UseDevelopmentStorage=true');

    beforeEach(function() {
        _tableService.listTablesSegmented(null, function(error, result, response) {
            if (result.entities) {
                result.entities.foreach(function(tableName) {
                    tableService.deleteTableIfExists(tableName);
                })
            }
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
            var logger = new winston.transports.AzureLogger({
                useDevStorage: true,
                callback: function() { 
                    _tableService.listTablesSegmented(null, function(err, result, response) {
                        expect(result.entries).to.have.length('1');
                        expect(result.entries).to.include('log');
                    })

                    done(); 
                }
            });

        });
    });

    describe('log', function() {
        it('happy path', function(done) {
            var logger = new winston.transports.AzureLogger({
                useDevStorage: true,
                callback: function() { done(); }
            });

            var msg = Math.random().toString(36).replace(/[^a-z]+/g, '');
            logger.log('level', msg, '', function() { done() });
        });
    });
});
