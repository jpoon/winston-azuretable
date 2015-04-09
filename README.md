winston-azuretable
==================

[![NPM version](https://badge.fury.io/js/winston-azuretable.svg)](http://badge.fury.io/js/winston-azuretable)
[![Dependency Status](https://david-dm.org/jpoon/winston-azuretable.svg)](https://david-dm.org/jpoon/winston-azuretable)
[![devDependency Status](https://david-dm.org/jpoon/winston-azuretable/dev-status.svg)](https://david-dm.org/jpoon/winston-azuretable#info=devDependencies)
[![Code Climate](https://codeclimate.com/github/jpoon/winston-azuretable/badges/gpa.svg)](https://codeclimate.com/github/jpoon/winston-azuretable)

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
* **account**: Azure Storage Account Name. In lieu of this setting, you can set the environment variable: `AZURE_STORAGE_ACCOUNT`
* **key**: Azure Storage Account Key. In lieu of this setting, you can set the environment variable: `AZURE_STORAGE_ACCESS_KEY`
* **level**: lowest logging level transport to be logged (default: `info`)
* **tableName**: name of the table to log messages (default: `log`)
* **partitionKey**: table partition key to use (default: `process.env.NODE_ENV`)
* **silent**: Boolean flag indicating whether to suppress output (default: `false`)

Table Entity
------------
Each log entry will create the following entity:

* **PartitionKey**: table partition key (default: `process.env.NODE_ENV`)
* **RowKey**: number of milliseconds since epoch
* **hostname**: hostname of operating system
* **pid**: node process id
* **level**: winston logging level
* **msg**: logging message
* **createdDateTime**: date log entry created
* *[metadata properties]*: creates associated property in entity for each given metadata property


Inspirations/Alternatives
-------------------------
Inspired by [winston-skywriter](https://github.com/pofallon/winston-skywriter/). Differences in implementation include: 

* support for latest Azure SDK (0.10.0)
* dependency against Azure SDK directly instead of an intermediary library (bluesky)
* row key is the number of milliseconds since epoch resulting in Azure table naturally having most recent log entry first
* implementation of Winston query method.
