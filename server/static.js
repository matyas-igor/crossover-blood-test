var express = require('express');
var path = require('path');
var logger = require('morgan');
var router = express.Router();

var config = require(__base + '/config/config.js');

var app = express();

app.use('/bower_components',  express.static(__root + '/bower_components'));
app.use('/node_modules',  express.static(__root + '/node_modules'));

app.set('views', path.join(__root, 'public'));
//app.engine('html', require('ejs').renderFile);

app.use(logger('dev'));

app.use(express.static(path.join(__root, 'public')));

/* GET index.html / home page */
app.use('/', router.get('/', function(req, res, next) {
    res.render('index.html');
}));

// catch 404 and forward to index.html
app.use(function(req, res, next) {
    res.render('index.html');
});

var server = app.listen(config.get('server-static:port'), function() {
    var host = config.get('server-static:host');
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
    console.log('\n------------------------------------------------\n');
});

module.exports = app;