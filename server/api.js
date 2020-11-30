var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require(__base + '/config/config.js');
var socket = require(__base + '/socket/socket.js');

var app = express();

app.use('/bower_components',  express.static(__root + '/bower_components'));
app.use('/node_modules',  express.static(__root + '/node_modules'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__root, 'public')));

// CORS support
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Origin,Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, UPDATE, OPTIONS");
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    next();
});

var users = require(path.join(__base, 'routes', 'users'));

app.use('/api/v1/', users);

app.use(function errorHandler(err, req, res, next) {
    res.status(400);
    res.send(err.message);
    next(res);
});

var server = app.listen(process.env.PORT || config.get('server-api:port'), function() {
    var host = config.get('server-api:host') || 'localhost';
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
    console.log('\n------------------------------------------------\n');
});

socket.init(server);

module.exports = app;