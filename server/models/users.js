var mongojs = require('mongojs');
var _ = require('lodash');
var db = mongojs('mongodb://igor:9HnLWf4LVWkcTyAj@cluster-shard-00-00.jacuj.mongodb.net:27017,cluster-shard-00-01.jacuj.mongodb.net:27017,cluster-shard-00-02.jacuj.mongodb.net:27017/blood?ssl=true&replicaSet=atlas-lbsakx-shard-0&authSource=admin&retryWrites=true&w=majority', ['users']);
var Q = require("q");

var UsersModel = {
    getAll: function() {
        var deferred = Q.defer();
        db.users.find(function(err, users) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(users);
            }
        });
        return deferred.promise;
    },
    find: function(filter) {
        var deferred = Q.defer();
        db.users.find(filter, function(err, users) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(users);
            }
        });
        return deferred.promise;
    },
    getById: function(id) {
        var deferred = Q.defer();
        db.users.findOne({
            user_id: id
        }, function(err, user) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(user);
            }
        });
        return deferred.promise;
    },
    getByToken: function(token) {
        var deferred = Q.defer();
        db.users.findOne({
            token: token
        }, function(err, user) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(user);
            }
        });
        return deferred.promise;
    },
    insert: function(user) {
        db.users.insert(user);
        return true;
    },
    update: function(id, token, user) {
        var deferred = Q.defer();

        UsersModel.getById(id)
            .then(function(userToUpdate) {

                if (!userToUpdate) {
                    deferred.reject('Internal error');
                    return;
                }
                if (userToUpdate.token != token) {
                    deferred.reject('Internal error');
                    return;
                }

                _.extend(userToUpdate, user);

                db.users.update({
                    user_id: id
                }, userToUpdate, {}, function(err, result) {
                    if (err) {
                        throw new Error(err);
                    } else {
                        deferred.resolve(userToUpdate);
                    }
                });
            })
            .catch(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    }
};

module.exports = UsersModel;
