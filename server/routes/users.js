var express = require('express');
var router = express.Router();
var _ = require('lodash');
var uuid = require('node-uuid');
var socket = require(__base + '/socket/socket.js');
var validator = require('is-my-json-valid');

var UsersModel = require(__base + '/models/users.js');

/* GET All Users */
router.get('/users', function(req, res, next) {

    var validate = validator({
        type: "object",
        required: true,
        properties: {
            xmin: {"type": "string", required: true},
            xmax: {"type": "string", required: true},
            ymin: {"type": "string", required: true},
            ymax: {"type": "string", required: true}
        }
    });
    if (!validate(req.query)) {
        throw new Error('Wrong parameters');
    }

    var filter = {
        x: {$gte: parseFloat(req.query.xmin), $lte: parseFloat(req.query.xmax)},
        y: {$gte: parseFloat(req.query.ymin), $lte: parseFloat(req.query.ymax)},
        type: 'donor',
        donation: true
    };

    UsersModel.find(filter)
        .then(function(users) {
            var usersProcessed = _.map(users, function(user) {
                if (user.email) {
                    delete user.email;
                }
                if (user.phoneNumber) {
                    delete user.phoneNumber;
                }
                if (user.token) {
                    delete user.token;
                }
                return user;
            });
            res.json({users: usersProcessed});
        })
        .catch(function(err) {
            throw new Error(err);
        });
});

/* GET One User with the provided ID */
router.get('/user/:id', function(req, res, next) {
    var validateGet = validator({type: "string", required: true});
    if (!validateGet(req.params.id)) {
        throw new Error('Wrong parameters');
    }

    UsersModel.getById(req.params.id)
        .then(function(user) {
            if (!user) throw new Error('Wrong parameters');
            // removing token due to security reasons
            if (user.token) {
                delete user.token;
            }
            res.json({user: user});
        })
        .catch(function(err) {
            throw new Error(err);
        });
});

/* GET One User with the provided Token */
router.get('/user/token/:token', function(req, res, next) {
    var validateGet = validator({type: "string", required: true});
    if (!validateGet(req.params.token)) {
        throw new Error('Wrong parameters');
    }

    UsersModel.getByToken(req.params.token)
        .then(function(user) {
            if (!user) throw new Error('Wrong parameters');
            res.json({user: user});
        })
        .catch(function(err) {
            throw new Error(err);
        });
});

/* POST/SAVE a User */
router.post('/user', function(req, res, next) {
    var user = req.body;

    var validate = validator({
        type: "object",
        required: true,
        properties: {
            user_id: {"type": "string", required: true}
        }
    });
    if (!validate(user)) {
        throw new Error('Wrong parameters');
    }

    // Creating a new default user
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    _.extend(user, {
        ip: ip,
        type: null,
        token: uuid.v4(),
        donation: false,
        bloodGroup: 'O−'
    });
    UsersModel.insert(user);

    res.json({user: user});
});

/* PUT/UPDATE a User */
router.put('/user/:id/:token', function(req, res, next) {
    var validateGet = validator({type: "string", required: true});
    if (!validateGet(req.params.id) || !validateGet(req.params.token)) {
        throw new Error('Wrong parameters');
    }

    var user = req.body;
    var validate = validator({
        type: "object",
        required: true,
        properties: {
            type: {"type": "string"},
            email: {"type": "string"},
            address: {"type": "string"},
            phoneNumber: {"type": "string"},
            firstName: {"type": "string"},
            lastName: {"type": "string"},
            bloodGroup: {"type": "string"},
            donation: {"type": "boolean"}
        }
    });
    if (!validate(user)) {
        throw new Error('Wrong parameters');
    }

    var userToUpdate = {};

    if (user.type) {
        userToUpdate.type = user.type;
    }
    if (user.email) {
        userToUpdate.email = user.email;
    }
    if (user.address) {
        userToUpdate.address = user.address;
    }
    if (user.phoneNumber) {
        userToUpdate.phoneNumber = user.phoneNumber;
    }
    if (user.firstName) {
        userToUpdate.firstName = user.firstName;
    }
    if (user.lastName) {
        userToUpdate.lastName = user.lastName;
    }
    if (user.bloodGroup) {
        userToUpdate.bloodGroup = user.bloodGroup;
    }
    if (user.donation != undefined) {
        userToUpdate.donation = user.donation;
    }
    if (user.x) {
        userToUpdate.x = user.x;
    }
    if (user.y) {
        userToUpdate.y = user.y;
    }

    if (!userToUpdate) {
        throw new Error('Wrong parameters');
    } else {

        // Get the user
        UsersModel.getById(req.params.id)
            .then(function(user) {
                if (!user) throw new Error('Wrong parameters');

                // Send message to socket
                if (user.type == 'patient' && userToUpdate.type == 'donor' && (user.donation || userToUpdate.donation)) { // change type from potient to donor
                    socket.emit('points', {type: 'add', user: _.extend({}, user, userToUpdate)});
                } else if (user.donation && user.type == 'donor' && (userToUpdate.type == 'donor' || userToUpdate.type == undefined) && userToUpdate.donation) { // change location of a point
                    socket.emit('points', {type: 'remove', userId: user.user_id});
                    socket.emit('points', {type: 'add', user: _.extend({}, user, userToUpdate)});
                } else if (userToUpdate.donation && user.type == 'donor') { // create donation
                    socket.emit('points', {type: 'add', user: _.extend({}, user, userToUpdate)});
                } else if (userToUpdate.donation === false && user.type == 'donor') { // remove donation
                    socket.emit('points', {type: 'remove', userId: user.user_id});
                } else if (userToUpdate.type == 'patient' && user.type == 'donor' && user.donation) { // change to patient
                    socket.emit('points', {type: 'remove', userId: user.user_id});
                }

                // Updating user
                UsersModel.update(req.params.id, req.params.token, userToUpdate)
                    .then(function(user) {
                        if (!user) throw new Error('Wrong parameters');
                        res.json({user: user});
                    })
                    .catch(function(err) {
                        throw new Error(err);
                    });

            })
            .catch(function(err) {
                throw new Error(err);
            });
    }
});

module.exports = router;