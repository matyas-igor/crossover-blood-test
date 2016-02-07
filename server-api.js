GLOBAL.__root = __dirname;
GLOBAL.__base = __dirname + '/server';

var argv = require('yargs').argv;

GLOBAL.__environment = argv.environment || argv.e || 'production';

var serverApi = require(__base + '/api.js');