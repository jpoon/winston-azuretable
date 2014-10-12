winston-azuretable
==================

[![NPM version](https://badge.fury.io/js/winston-azuretable.svg)](http://badge.fury.io/js/winston-azuretable)

An Azure Table Storage transport for [Winston](https://github.com/flatiron/winston) logging library.

Installation
------------

```
  $ npm install winston
  $ npm install winston-azuretable
```

Usage
-----
```
  var winston = require('winston');
  var azureLogger = require('winston-azuretable').AzureLogger

  winston.add(azureLogger, options);
```

The transport accepts the following options:

* **useDevStorage**: Boolean flag denoting whether to use the Azure Storage Emulator (default: `false`)
* **account**: Azure Storage Account Name
* **key**: Azure Storage Account Key
* **level**: lowest logging level transport to be logged (default: `info`)
* **tableName**: name of the table to log messages (default: `log`)
* **partitionKey**: table partition key to use (default: `process.env.NODE_ENV`)
* **silent**: Boolean flag indicating whether to suppress output (default: `false`)
