winston-azuretable
==================

[![NPM version](https://badge.fury.io/js/winston-azuretable.svg)](http://badge.fury.io/js/winston-azuretable)

An Azure Table transport for Winston logging library.

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

  winston.add(azureLogger), options);
```

The transport accepts the following options:

* **useDevStorage**: Boolean flag denoting whether to use the Azure Storage Emulator (default: `false`)
* **account**: Azure Storage Account Name
* **key**: Azure Storage Account Key
* **level**: lowest logging level transport will log (default: `info`)
* **partitionKey**: table partition key (default: `process.env.NODE_ENV`)
* **tableName**: name of the table to log messages (default: `log`)
* **silent**: Boolean flag indicating whether to suppress output (default: `false`)
