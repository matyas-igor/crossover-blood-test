var winston = require('winston'),
    config = require(__base + '/config/config.js');

var level = 'error';

switch (__environment) {
    case 'development':
        level = 'silly';
        break;
    case 'testing':
        level = 'debug';
        break;
    case 'production':
        level = 'warn';
        break;
}

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: level,
            colorize: true,
            timestamp: true,
            prettyPrint: true
        })
    ]
});

console.log('\n------------------------------------------------\n');
console.log('Application: ', config.get('name'));
console.log('Environment: ', __environment);
console.log('Root path: ', __base);
console.log('\n------------------------------------------------\n');

module.exports = logger;