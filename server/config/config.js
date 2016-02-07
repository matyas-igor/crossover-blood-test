var nconf = require('nconf');

nconf.argv().env().file({file: __root + '/config/'+__environment+'.json'});

module.exports = nconf;