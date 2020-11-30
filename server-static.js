global.__root = __dirname;
global.__base = __dirname + '/server';

var argv = require('yargs').argv;

global.__environment = argv.environment || argv.e || 'production';

var serverStatic = require(__base + '/static.js');