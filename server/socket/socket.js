
var io = null;

var socket = {
    init: function(server) {
        io = require('socket.io').listen(server);

        io.on('connection', function(socket) {
            console.log('User connected');
            socket.on('disconnect', function(){
                console.log('User disconnected');
            });
        });
    },
    emit: function(channel, message) {
        if (channel == 'points' && message.user && message.type == 'add') {
            if (message.user.email) {
                delete message.user.email;
            }
            if (message.user.phoneNumber) {
                delete message.user.phoneNumber;
            }
        }

        if (io) {
            io.emit(channel, message);
        }
    }
};

module.exports = socket;