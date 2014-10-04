var expect = require('chai').expect;
var chai = require('chai');

var azure = require('azure');
var winston = require('winston');
var azureLogger = require("../lib/winston-azure.js").AzureLogger;

describe('azure logger', function() {
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
    });
});
