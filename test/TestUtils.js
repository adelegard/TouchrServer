var _ = require('underscore'),
    Q = require('q'),
    constants = require('../cloud/constants.js'),
    Parse = require('parse').Parse;

var getTestUsernameWithPrefixAndNum = function(prefix, num) {
    return prefix + "_" + num;
};

var usernamePrefix = 'apitest1',
numUsers = 3;

exports.onTestFailure = function(error) {
    console.log("error: " + error);
    exports.destroyTestUsers(null, error);
};

exports.setupData = function() {
    var setupDefer = Q.defer(),
        users = [],
        touchTypes = [];

    // create some users

    var touchTypeQueries = [];

    // create some touchTypes
    var TouchType = Parse.Object.extend(constants.TableTouchType);
    touchType = new TouchType();

    touchType.set(constants.ColumnTouchTypeName, "touch");
    touchType.set(constants.ColumnTouchTypeBgColor, "#ffffff");
    touchType.set(constants.ColumnTouchTypeTextColor, "#777777");
    touchType.set(constants.ColumnTouchTypeIsDefault, false);
    touchType.set(constants.ColumnTouchTypeIsPrivate, false);
    touchType.set(constants.ColumnTouchTypeSteps, [
    {
        "durationMs": 2000,
        "text": "Give them a little touch"
    },
    {
        "durationMs": 2000,
        "text": "Give them a little poke"
    },
    {
        "durationMs": 2000,
        "text": "Give them a jab"
    }
    ]);

    touchTypeQueries.push(touchType.save(null, {
        success: function(obj) {
            touchTypes.push(obj);
        },
        error: function(touchType, error) {
            exports.onTestFailure(error);
        }
    }));

    touchType = new TouchType();

    touchType.set(constants.ColumnTouchTypeName, "poke");
    touchType.set(constants.ColumnTouchTypeBgColor, "#ffffff");
    touchType.set(constants.ColumnTouchTypeTextColor, "#777777");
    touchType.set(constants.ColumnTouchTypeIsDefault, false);
    touchType.set(constants.ColumnTouchTypeIsPrivate, false);
    touchType.set(constants.ColumnTouchTypeSteps, [
    {
        "durationMs": 2000,
        "text": "Give them a little hug"
    },
    {
        "durationMs": 2000,
        "text": "Give them a medium hug"
    },
    {
        "durationMs": 2000,
        "text": "Give them a long hug"
    }
    ]);

    touchTypeQueries.push(touchType.save(null, {
        success: function(obj) {
            touchTypes.push(obj);
        },
        error: function(touchType, error) {
            exports.onTestFailure(error);
        }
    }));

    Parse.Promise.when(touchTypeQueries).then(function() {
        var onSuccess = function(user, num) {
            users.push(user);
            if (users.length < numUsers) {
                // logout of all but the last created user
                Parse.User.logOut();
            }
            userDeferred[num].resolve();
        };

        var userDeferred = [];
        var userPromises = [];
        _.each(_.range(numUsers), function(num) {
            var defer = Q.defer();
            userDeferred.push(defer);
            userPromises.push(defer.promise);
        });

        Parse.Promise.when(userPromises).then(function() {
            // all users created
            setupDefer.resolve({
                users: users,
                touchTypes: touchTypes
            });
        });

        _.each(_.range(numUsers), function(num) {
            var user = new Parse.User();
            var text = getTestUsernameWithPrefixAndNum(usernamePrefix, num);
            user.set("username", text);
            user.set("password", text);
            user.set("email", text + "@" + "test.com");

            var doSignup = function() {
                user.signUp(null, {
                success: function(signedUpUser) {
                    // console.log("created test user: " + signedUpUser.get("username") + " (" + signedUpUser.id + ")");
                    signedUpUser.set("password", text);

                    Parse.Cloud.run(constants.MethodNames.addUserTouchType, {touchTypeObjectId: _.first(touchTypes).id}, {
                    success: function() {
                        onSuccess(signedUpUser, num);
                    },
                    error: function(error) {
                        exports.onTestFailure(error);
                    }
                    });
                },
                error: function(user, error) {
                    console.log("couldnt sign up");
                    exports.onTestFailure(error);
                }
                });
            };

            if (num === 0) {
                doSignup();
            } else {
                // wait for the previous promise to be resolved (or if its the first one just go)
                userPromises[num-1].done(function() {
                    doSignup();
                });
            }
        });
    });
    return setupDefer.promise;
};

exports.destroyTestUsers = function(done, error) {
    var userNum = 0;
    var onLoginSuccess = function(user, userNum) {
        Parse.Cloud.run(constants.MethodNames.getTouchTypes, {}, {
            success: function(touchTypes) {
                var promises = [];
                var query = new Parse.Query(Parse.Object.extend(constants.TableTouchType));
                query.containedIn(constants.ColumnObjectId, _.map(touchTypes, function(touchType) {
                    return touchType.objectId;
                }));
                query.find().then(function(objs) {
                    _.each(objs, function(obj) {
                        promises.push(obj.destroy());
                    });
                });
                return Parse.Promise.when(promises);
            },
            error: function(error) {
                // The delete failed.
                // error is a Parse.Error with an error code and message.
                throw error;
            }
        }).then(function() {
            // Every touch type was deleted.
            // now lets delete the user
            Parse.Cloud.run(constants.MethodNames.deleteUser, {}, {
                success: function() {
                    // console.log("destroyed test user: " + user.get("username") + " (" + user.id + ")");

                    // The object was deleted from the Parse Cloud.
                    Parse.User.logOut();
                    userNum++;
                    if (userNum === numUsers) {
                        // all users destroyed
                        if (error) {
                            throw error;
                        } else {
                            done();
                        }
                    } else {
                        loginWithEachUserAndRunCallback(userNum, onLoginSuccess);
                    }
                },
                error: function(error) {
                    // The delete failed.
                    // error is a Parse.Error with an error code and message.
                    throw error;
                }
            });
        });
    };
    loginWithEachUserAndRunCallback(userNum, onLoginSuccess);
};

var loginWithEachUserAndRunCallback = function(userNum, callback) {
    // now log in with one of these newly created users
    Parse.User.logIn(getTestUsernameWithPrefixAndNum(usernamePrefix, userNum), getTestUsernameWithPrefixAndNum(usernamePrefix, userNum), {
        success: function(user) {
            // Do stuff after successful login.
            callback(user, userNum);
        },
        error: function(user, error) {
            // The login failed. Check error to see why.
            throw error;
        }
    });
};


