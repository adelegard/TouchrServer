
var _ = require('underscore'),
    // Import Underscore.string to separate object, because there are conflict functions (include, reverse, contains)
    _str = require('cloud/lib_underscore_string'),
    moment = require('moment'),
    constants = require('cloud/constants'),
    queryHelper = require('cloud/query_helper');


var getObjectAttributesWithObjectId = function(object) {
    return _.extend({
        objectId: object.id
    }, object.attributes);
};

/* Returns your friends as a list of UserTouch objects {PFUser, touchDuration}
 * UI - Friends
 */
Parse.Cloud.define(constants.MethodNames.getFriends, function(request, response) {
    var friends;
    var page = parseInt(request.params.page, 10);

    if (!_.isNumber(page) || _.isNaN(page)) {
        page = 1;
    }

    var queries = [
        queryHelper.getQueryAllUserFriendsForUser(request.user, page).find({
            success: function(results) {
                friends = results;
            },
            error: function() {
                response.error("failed to lookup friends!");
            }
        })
    ];

    Parse.Promise.when(queries).then(function() {
        response.success(queryHelper.getAllUserFriends(request.user, friends));
    });
});



/* Returns your friends that have either touched you or you have touched them as a list of UserTouch objects {PFUser, touchDuration}
 * UI - Settings -> Clear Touches
 */
Parse.Cloud.define(constants.MethodNames.getFriendsWithTouches, function(request, response) {
    // TODO: make this query use promises, and also make it not require N queries per number of friends. Ughhhh.
    // Though not sure if this is possible. Asked the question here: https://groups.google.com/forum/#!topic/parse-developers/6ypaKzolsW8

    var numSuccesses = 0;
    var friendsWithTouches = [];
    var onTouchesQuerySuccess = function(touch, friend) {
        numSuccesses++;
        if (touch) {
            friendsWithTouches.push(friend);
        }
        if (numSuccesses === friends.length) {
            response.success(queryHelper.getAllUserFriends(request.user, friendsWithTouches));
        }
    };
    
    var friends;
    queryHelper.getQueryAllUserFriendsForUser(request.user).find({
        success: function(results) {
            friends = results;
            _.each(friends, function(friend) {
                queryHelper.getQueryTouchesToOrFrom(request.user, friend.id).first({
                    success: function(touch) {
                        onTouchesQuerySuccess(touch, friend);
                    },
                    error: function() {
                        response.error("failed to lookup touches");
                    }
                });
            });
        },
        error: function() {
            response.error("failed to lookup friends!");
        }
    });
});

var getTotalMsOfTouches = function(touches) {
    return _.reduce(touches, function(memo, touch) {
        return memo + touch.get(constants.ColumnTouchDuration);
    }, 0);
};

/*
 * UI - Friends List -> Slide to the right -> INFO
 */
Parse.Cloud.define(constants.MethodNames.getFriendDetails, function(request, response) {
    var userFriendObjectId = _str.stripTags(request.params.userFriendObjectId);
    if (!_.isString(userFriendObjectId) || userFriendObjectId.length === 0) {
        response.error("no usable value for userFriendObjectId");
    }
    
    queryHelper.getQueryTouchesToOrFrom(request.user, userFriendObjectId).find({
        success: function(touches) {
            var touchesTo = _.filter(touches, function(touch) {
                return touch.get(constants.ColumnTouchUserFromObjectId) === request.user.id;
            });
            var touchesFrom = _.difference(touches, touchesTo);
            response.success({
                numTouchesTo: touchesTo.length,
                numTouchesFrom: touchesFrom.length,
                touchesToMs: getTotalMsOfTouches(touchesTo),
                touchesFromMs: getTotalMsOfTouches(touchesFrom)
            });
        },
        error: function(error) {
            response.error("Got an error " + error.code + " : " + error.message);
        }
    });
});

/* Removes all rows in the Touch table that have either userFrom or userTo being the passed in userId
 * UI - Settings -> Clear Touches (for a specific user)
 */
Parse.Cloud.define(constants.MethodNames.removeTouchesToOrFromUser, function(request, response) {
    var userFriendObjectId = _str.stripTags(request.params.userFriendObjectId);
    if (!_.isString(userFriendObjectId) || userFriendObjectId.length === 0) {
        response.error("no usable value for userFriendObjectId");
    }

    queryHelper.getQueryTouchesToOrFrom(request.user, userFriendObjectId).find().then(function(results) {
        // Collect one promise for each delete into an array.
        var promises = [];
        _.each(results, function(result) {
            // Start this delete immediately and add its promise to the list.
            promises.push(result.destroy());
        });
        // Return a new promise that is resolved when all of the deletes are finished.
        return Parse.Promise.when(promises);
        
    }).then(function() {
        // Every touch was deleted
        response.success("successfully removed all touches for user: " + userFriendObjectId);
    });
});


/* Returns the touches to you as a list of UserTouch objects {PFUser, touchDuration}
 * UI - Inbox
 */
Parse.Cloud.define(constants.MethodNames.getTouchesToUser, function(request, response) {
    var friends;
    var touchesToYou;
    var touchTypes;
    
    var page = parseInt(request.params.page, 10);
    
    if (!_.isNumber(page) || _.isNaN(page)) {
        page = 1;
    }
    
    var queries = [
        queryHelper.getQueryAllUserFriendsForUser(request.user).find({
            success: function(results) {
                friends = results;
            },
            error: function() {
                response.error("failed to lookup friends!");
            }
        }),
        queryHelper.getTouchesToUserQuery(request.user, page).find({
            success: function(results) {
                touchesToYou = results;
            },
            error: function() {
                response.error("failed to get touches to user!");
            }
        }),
        queryHelper.getTouchTypesQuery().find({
            success: function(objects) {
                touchTypes = _.map(objects, function(object) {
                    return getObjectAttributesWithObjectId(object);
                });
            },
            error: function() {
                response.error("failed to get touch types");
            }
        })
    ];
    
    Parse.Promise.when(queries).then(function() {
        response.success(queryHelper.getTouchesToUserWithFriends(request.user, touchesToYou, friends, touchTypes));
    });
});

Parse.Cloud.define(constants.MethodNames.getTouchTypes, function(request, response) {
    queryHelper.getTouchTypesQuery().find({
        success: function(objects) {
            response.success(_.map(objects, function(object) {
                return getObjectAttributesWithObjectId(object);
            }));
        },
        error: function() {
            response.error("failed to get touch types");
        }
    });
});

Parse.Cloud.define(constants.MethodNames.getUserTouchTypes, function(request, response) {
    queryHelper.getUserTouchTypesQuery().find({
        success: function(objects) {
            response.success(_.map(objects, function(object) {
                return getObjectAttributesWithObjectId(object);
            }));
        },
        error: function() {
            response.error("failed to get touch types for userId: " + Parse.User.current().id);
        }
    });
});


// AfterSave method that runs after every User save
//Parse.Cloud.afterSave(constants.TableUser, function(request) {
//    queryHelper.getDefaultTouchTypeQuery().find({
//        success: function(touchTypes) {
//            var user = Parse.User.current();
//            var relation = user.relation(constants.ColumnUserTouchTypes);
//            relation.add(touchTypes);
//            user.save().then(function(obj) {
//                response.success("Successfully added default touch types for userId: " + user.id);
//            }, function(error) {
//                response.error("error saving touch relation: " + _.values(error));
//            });
//        },
//        error: function() {
//            response.error("Error: couldn't find default touch types");
//        }
//    });
//});

Parse.Cloud.define(constants.MethodNames.addUserTouchType, function(request, response) {
    var touchTypeObjectId = _str.stripTags(request.params.touchTypeObjectId);
    
    if (!_.isString(touchTypeObjectId) || touchTypeObjectId.length === 0) {
        response.error("touchTypeObjectId not valid!");
        return;
    }
    
    var touchType,
        orderNum,
        userHasTouchType = false,
        touchTypeError = false,
        largestUserTypeError = false;
    Parse.Promise.when([
        queryHelper.getTouchTypeQueryForTouchTypeId(touchTypeObjectId).first({
            success: function(object) {
                touchType = object;
            },
            error: function() {
                touchTypeError = true;
                response.error("Error: touchType not found with id: " + touchTypeObjectId);
            }
        }),
        queryHelper.getUserTouchTypesQueryForTouchTypeId(touchTypeObjectId).first({
            success: function(obj) {
                if (!_.isUndefined(obj)) {
                    userHasTouchType = true;
                    response.error("Error: touchTypeObjectId already in use: " + touchTypeObjectId);
                }
            }
        }),
        queryHelper.getUserTouchTypeQueryLargestOrder().first({
            success: function(obj) {
                if (_.isUndefined(obj)) {
                    orderNum = 1;
                } else {
                    orderNum = obj.get(constants.ColumnUserTouchTypeOrder) + 1;
                }
            },
            error: function() {
                largestUserTypeError = true;
                response.error("error retrieving largest order user touch type: " + _.values(error));
            }
        })
    ]).then(function() {
        if (userHasTouchType || touchTypeError || largestUserTypeError) {
            return;
        }
        queryHelper.getNewUserTouchTypeQueryWithUserAndTouchTypeAndOrder(
            Parse.User.current(),
            touchType,
            orderNum)
        .save().then(function(obj) {
            response.success(getObjectAttributesWithObjectId(obj));
        }, function(error) {
            response.error("error saving user touch type: " + _.values(error));
        });
    }, function(error) {
        response.error(error);
    });
});

Parse.Cloud.define(constants.MethodNames.removeUserTouchType, function(request, response) {
    var touchTypeObjectId = _str.stripTags(request.params.touchTypeObjectId);
    
    if (!_.isString(touchTypeObjectId) || touchTypeObjectId.length === 0) {
        response.error("touchTypeObjectId not valid!");
        return;
    }
    
    queryHelper.getUserTouchTypesQueryForTouchTypeId(touchTypeObjectId).first({
        success: function(userTouchType) {
            userTouchType.destroy().then(function() {
                response.success("Successfully removed user touch type: " + touchTypeObjectId + " for userId: " + request.user.id);
            }, function(error) {
                response.error("error removing user touch type: " + _.values(error));
            });
        },
        error: function(error) {
            response.error("error retrieving user touch type: " + _.values(error));
        }
    });
});


Parse.Cloud.define(constants.MethodNames.setUserTouchTypes, function(request, response) {
    var touchTypeObjectIds = request.params.touchTypeObjectIds;
    
    if (!_.isArray(touchTypeObjectIds) || touchTypeObjectIds.length === 0) {
        response.error("touchTypeObjectIds not an array!");
        return;
    }
    
    var getIndexOf = function(touchType) {
        var index = 0;
        _.find(touchTypeObjectIds, function(touchTypeObjectId) {
            if (touchTypeObjectId === touchType.id) return true;
            index++;
            return false;
        });
        return index;
    };

    var touchTypes,
        userTouchTypes = [];
    queryHelper.getTouchTypeQueryForTouchTypeIds(touchTypeObjectIds).find().then(function(objects) {
        // sort them by the order they were passed in with
        touchTypes = objects;
        return new Parse.Promise().resolve();
    }).then(function() {
        return queryHelper.getUserTouchTypesQuery().find();
    }).then(function(userTouchTypes) {
        // Return a new promise that is resolved when all of the deletes are finished.
        return Parse.Promise.when(_.map(userTouchTypes, function(userTouchType) {
            // Start this delete immediately and add its promise to the list.
            return userTouchType.destroy();
        }));
    }).then(function() {
        // all user touchTypes were deleted
        // now let's re-add our userTouchTypes
        // Return a new promise that is resolved when all of the deletes are finished.
        return Parse.Promise.when(_.map(_.sortBy(touchTypes, function(touchType) {
            return getIndexOf(touchType);
        }), function(touchType, index) {
            // Start this delete immediately and add its promise to the list.
            return queryHelper.getNewUserTouchTypeQueryWithUserAndTouchTypeAndOrder(
                request.user,
                touchType,
                index).save();
        }));
    }).then(function() {
        return queryHelper.getUserTouchTypesQuery().find();
    }).then(function(userTouchTypes) {
        // user touch types set!
        response.success(_.sortBy(_.map(userTouchTypes, function(object){
            return getObjectAttributesWithObjectId(object);
        }), function(object) {
            return object[constants.ColumnUserTouchTypeOrder];
        }));
    }, function(error) {
        response.error("error: " + _.values(error));
    });
});

Parse.Cloud.define(constants.MethodNames.removeUserTouchTypes, function(request, response) {
    queryHelper.getUserTouchTypesQuery().find().then(function(userTouchTypes) {
        if (!_.isArray(userTouchTypes) || userTouchTypes.length === 0) {
            return new Parse.Promise().resolve();
        }
        // Return a new promise that is resolved when all of the deletes are finished.
        return Parse.Promise.when(_.map(userTouchTypes, function(userTouchType) {
            // Start this delete immediately and add its promise to the list.
            return userTouchType.destroy();
        }));
    }).then(function() {
        // user touch types set!
        response.success("user touch types removed!");
    }, function(error) {
        response.error("error: " + _.values(error));
    });
});

/* Returns the touches you've made as a list of UserTouch objects {PFUser, touchDuration}
 * UI - Sent
 */
Parse.Cloud.define(constants.MethodNames.getTouchesFromUser, function(request, response) {
    var friends;
    var touchesFromYou;
    var touchTypes;
    
    var page = parseInt(request.params.page, 10);
    
    if (!_.isNumber(page) || _.isNaN(page)) {
        page = 1;
    }
    
    var queries = [
        queryHelper.getQueryAllUserFriendsForUser(request.user).find({
            success: function(results) {
                friends = results;
            },
            error: function() {
                response.error("failed to lookup friends!");
            }
        }),
        queryHelper.getTouchesFromUserQuery(request.user, page).find({
            success: function(results) {
                touchesFromYou = results;
            },
            error: function() {
                response.error("failed to get touches to user!");
            }
        }),
        queryHelper.getTouchTypesQuery().find({
            success: function(objects) {
                touchTypes = _.map(objects, function(object) {
                    return getObjectAttributesWithObjectId(object);
                });
            },
            error: function() {
                response.error("failed to get touch types");
            }
        })
    ];

    Parse.Promise.when(queries).then(function() {
        response.success(queryHelper.getTouchesFromUserWithFriends(
                    request.user,
                    touchesFromYou,
                    friends,
                    touchTypes));
    });
});

Parse.Cloud.define(constants.MethodNames.touchUser, function(request, response) {

    var userToObjectId      = _str.stripTags(request.params.userToObjectId);
    var durationMs          = request.params.durationMs;
    var touchTypeObjectId   = _str.stripTags(request.params.touchTypeObjectId);

    if (!_.isString(userToObjectId) || userToObjectId.length === 0) {
        response.error("userToObjectId needs to be a string!");
        return;
    }
    if (!_.isNumber(durationMs) || _.isNaN(durationMs) || durationMs <= 0) {
        response.error("durationMs must be a number greater than zero!");
        return;
    }
    if (!_.isString(touchTypeObjectId) || touchTypeObjectId.length === 0) {
        response.error("touchTypeObjectId needs to be a string!");
        return;
    }
    
    var userTo;
    var userTouchTypes;
    var userHasTouchType = false;
    
    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo(constants.ColumnObjectId, userToObjectId);
    
    var queries = [
        userQuery.first({
            success: function(object) {
                userTo = object;
            },
            error: function() {
                return Parse.Promise.error("failed to lookup user with objectId: " + userToObjectId);
            }
        }),
        queryHelper.getUserTouchTypesQueryForTouchTypeId(touchTypeObjectId).first({
            success: function(userTouchType) {
                if (_.isUndefined(userTouchType)) {
                    return Parse.Promise.error("user does not have this touch type: " + touchTypeObjectId);
                } else {
                    userHasTouchType = true;
                }
            },
            error: function() {
                return Parse.Promise.error("failed to get user touch types for user: " + userToObjectId);
            }
        })
    ];
    
    Parse.Promise.when(queries).then(function() {
        if (!userHasTouchType) return;
        var Touch = Parse.Object.extend(constants.TableTouch);
        var touch = new Touch();
        touch.set(constants.ColumnTouchUserFrom, request.user);
        touch.set(constants.ColumnTouchUserFromObjectId, request.user.id);
        touch.set(constants.ColumnTouchUserTo, userTo);
        touch.set(constants.ColumnTouchUserToObjectId, userToObjectId);
        touch.set(constants.ColumnTouchDuration, durationMs);
        touch.set(constants.ColumnTouchTypeObjectId, touchTypeObjectId);
        
        touch.save().then(function(obj) {
            response.success("Successfully touched user: " + userToObjectId);
        }, function(error) {
            response.error("error saving touch: " + _.values(error));
        });
    }, function(error) {
        response.error("error: " + _.values(error));
    });
});

// BeforeSave TouchType validation
Parse.Cloud.beforeSave(constants.TableTouchType, function(request, response) {
    var name = request.object.get(constants.ColumnTouchTypeName);
    var bgColor = request.object.get(constants.ColumnTouchTypeBgColor);
    var textColor = request.object.get(constants.ColumnTouchTypeTextColor);
    var steps = request.object.get(constants.ColumnTouchTypeSteps);
    var isDefault = request.object.get(constants.ColumnTouchTypeIsDefault);

    var hasDurationMsSteps = !_.isUndefined(_.find(steps, function(step) {
        return _.isNumber(step.durationMs);
    }));
    var hasMinMsSteps = !_.isUndefined(_.find(steps, function(step) {
        return _.isNumber(step.minMs);
    }));

    if (hasDurationMsSteps && hasMinMsSteps) {
        response.error("steps cannot use both durationMs and minMs");
        return;
    }

    if (hasDurationMsSteps) {
        var numStepsWithDurations = _.filter(steps, function(step) {
            return _.isNumber(step.durationMs);
        }).length;
        if (numStepsWithDurations !== steps.length) {
            response.error("number of durationMs steps doesnt match steps length!");
            return;
        }
        // convert durationMs's into minMs and maxMs
        var totalDurationMs = 0;
        _.each(steps, function(step, index) {
            step.minMs = totalDurationMs;
            if ((steps.length-1) !== index) {
                // not the last step
                step.maxMs = step.minMs + step.durationMs;
            }
            delete step.durationMs;
            totalDurationMs += step.durationMs;
        });
        request.object.set(constants.ColumnTouchTypeSteps, steps);
    }

    var onlyOneStepWithMissingMaxMs = _.filter(steps, function(step) {
        return _.isUndefined(step.maxMs);
    }).length === 1;

    var errorMsg;
    var invalidStep = _.find(steps, function(step) {
        if (!_.isNumber(step.minMs) || (!_.isUndefined(step.maxMs) && !_.isNumber(step.maxMs))) {
            errorMsg = "--- no minMs or (no maxMs or it's not a number)";
            return true;
        }
        if (!_.isUndefined(step.maxMs) && step.minMs >= step.maxMs) {
            errorMsg = "--- no maxMs or minMs >= maxMs ---";
            return true;
        }
        if (!_.isString(step.textLong) || step.textLong.length === 0) {
            errorMsg = "--- no textLong ---";
            return true;
        }
        if (!_.isBoolean(isDefault)) {
            errorMsg = "--- isDefault must be a boolean ---";
            return true;
        }
        if (!_.isString(step.textLongAfter) || step.textLongAfter.length === 0) {
            errorMsg = "--- no textLongAfter ---";
            return true;
        }
        if (!_.isString(step.textNotif) || step.textNotif.length === 0) {
            errorMsg = "--- no textNotif ---";
            return true;
        }
        if (!_.isString(step.textShort) || step.textShort.length === 0) {
            errorMsg = "--- no textShort ---";
            return true;
        }
        return false;
    });

    var fullHexColorLength = 7;
    var poundSymbol = "#";
    if (!_.isString(name) || name.length === 0) {
        response.error("name must be specified");
    } else if (!_.isString(bgColor) || bgColor.length !== fullHexColorLength || _.first(bgColor) !== poundSymbol) {
        response.error("bgColor must be a valid hex color");
    } else if (!_.isString(textColor) || textColor.length !== fullHexColorLength || _.first(textColor) !== poundSymbol) {
        response.error("textColor must be a valid hex color");
    } else if (!_.isUndefined(invalidStep)) {
        response.error(errorMsg);
    } else if (!_.isArray(steps) || steps.length === 0) {
        response.error("steps cannot be empty");
    } else if (!onlyOneStepWithMissingMaxMs) {
        response.error("one of the steps must NOT have maxMs");
    } else {
        response.success();
    }
});

// AfterSave method that runs after every touch
// and sends a push notification to the UserTo user
Parse.Cloud.afterSave(constants.TableTouch, function(request) {
    if (request.object.get(constants.ColumnTouchHideForUserTo)) {
        console.log("not sending push b/c touch hideForUserTo was hidden");
        return;
    }
    if (request.object.get(constants.ColumnTouchHideForUserFrom)) {
        console.log("not sending push b/c touch hideForUserFrom was hidden");
        return;
    }
    var userToObjectId = request.object.get(constants.ColumnTouchUserToObjectId);
    var userFromObjectId = request.object.get(constants.ColumnTouchUserFromObjectId);
    
    // round the duration to one decimal place
    var durationMs = parseInt(request.object.get(constants.ColumnTouchDuration), 10);
    var durationSeconds = Math.round((((durationMs/1000) * 10 ) / 10));
    
    var userQueryTo = new Parse.Query(Parse.User);
    userQueryTo.equalTo(constants.ColumnObjectId, userToObjectId);
    
    var userQueryFrom = new Parse.Query(Parse.User);
    userQueryFrom.equalTo(constants.ColumnObjectId, userFromObjectId);
    
    var userTo;
    var userFrom;
    var touchType;
    var touchTypeId = request.object.get(constants.ColumnTouchTypeObjectId);
    queryHelper.getTouchTypeQueryForTouchTypeId(touchTypeId).first({
        success: function(object) {
            touchType = object;
        },
        error: function() {
            console.log("Error: touchType not found with id: " + touchTypeId);
        }
    }).then(function() {
        userQueryTo.first({
            success: function(user) {
                userTo = user;
            },
            error: function(error) {
                console.log(error);
                return;
            }
        });
    }).then(function() {
        userQueryFrom.first({
            success: function(user) {
                userFrom = user;
                if (_.isUndefined(touchType)) {
                    console.log("ERROR (no push sent): dont have touchType");
                    return;
                }
                if (_.isUndefined(userFrom)) {
                    console.log("ERROR (no push sent): dont have userFrom");
                    return;
                }
                if (_.isUndefined(userTo)) {
                    console.log("ERROR (no push sent): dont have userTo");
                    return;
                }
                // Successfully retrieved the user
                var userFromUsername = userFrom.get(constants.ColumnUserUsername);
                
                var touchTypeStep = queryHelper.getMatchingTouchTypeStepForTouchDuration(touchType.get(constants.ColumnTouchTypeSteps), durationMs);

                var pushQuery = new Parse.Query(Parse.Installation);
                pushQuery.matchesKeyInQuery(constants.ColumnInstallationUser, constants.ColumnObjectId, userQueryTo);
            
                Parse.Push.send({
                    where: pushQuery, // Set our Installation query
                    data: {
                        alert: _getPushNotificationMessage(userFromUsername, touchTypeStep.textNotif)
                    }
                    }, {
                        success: function() {
                            // Push was successful
                            console.log("sent push - userFrom: " + userFromUsername);
                        },
                        error: function(error) {
                            console.log("Got an error " + error.code + " : " + error.message);
                    }
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    });
});

var _getPushNotificationMessage = function(userToUsername, textNotif) {
    return userToUsername + " " + textNotif;
};

// get the FIRST unused Purchase Touch - and make it used
var _setFirstUnusedPurchasedTouchAsUsed = function(request, response, successCallback) {
    queryHelper.getPurchasedTouchesUnusedForUserQuery(request.user).first({
        success: function(purchasedTouch) {
            // Successfully retrieved the object.
            purchasedTouch.set(constants.ColumnTouchPurchaseUsed, true);
            purchasedTouch.set(constants.ColumnTouchPurchaseUsedAt, new Date());
            purchasedTouch.save().then(function(obj) {
                if (_.isFunction(successCallback)) {
                    successCallback();
                } else {
                    response.success("Successfully set purchased touch as used");
                }
            }, function(error) {
                response.error("error saving touch");
            });
        },
        error: function(error) {
            response.error(error);
        }
    });
};


/* Sets the "hideForUserTo" or "hideForUserFrom" columns to true for a given objectId and userToObjectId or userFromObjectId in the Touch table
 *
 * UI - swiping a touch cell to the left to reveal the "x" button
 *
 * params:
 * touchObjectId
 *
 * hideForUserTo (boolean)
 * or (not both)
 * hideForUserFrom (boolean)
 *
 */
Parse.Cloud.define(constants.MethodNames.hideTouch, function(request, response) {
    var touchObjectId = _str.stripTags(request.params.touchObjectId);
    var hideForUserTo = request.params.hideForUserTo;
    var hideForUserFrom = request.params.hideForUserFrom;
    
    if (!_.isBoolean(hideForUserTo) && !_.isBoolean(hideForUserFrom)) {
        response.error("neither hideForUserTo nor hideForUserFrom are booleans");
        return;
    }

    var touchQuery = new Parse.Query(Parse.Object.extend(constants.TableTouch));
    touchQuery.equalTo(constants.ColumnObjectId, touchObjectId);
    touchQuery.first({
        success: function(touch) {
            // Successfully retrieved the object.
            // Set hideForUserTo/hideForUserFrom to true, then save it.
            
            if (_.isBoolean(hideForUserTo)) {
                console.log("---- setting hideForUserTo ----- ");
                touch.set(constants.ColumnTouchHideForUserTo, hideForUserTo);
            } else if (_.isBoolean(hideForUserFrom)) {
                console.log("---- setting hideForUserFrom ----- ");
                touch.set(constants.ColumnTouchHideForUserFrom, hideForUserFrom);
            }

            touch.save().then(function(obj) {
                response.success("Successfully hid touch");
            }, function(error) {
                response.error("error hiding touch");
            });
        },
        error: function(error) {
            response.error(error);
        }
    });
});

// Delete User (and all their touches/friends/etc)
Parse.Cloud.define(constants.MethodNames.deleteUser, function(request, response) {
    var userId = request.user.id;
    
    var onAllDeletionsComplete = function() {
        if (!userDeletionRequestComplete || !friendRequestDeletionComplete ||
            !touchesDeletionComplete || !touchPurchasedDeletionComplete || !installationDeletionComplete) return;
        response.success("User deletion successful for userId: " + userId);
    };

    var userDeletionRequestComplete = false;

    request.user.destroy({
        success: function(userObject) {
            // The object was deleted from the Parse Cloud.
            userDeletionRequestComplete = true;
            onAllDeletionsComplete();
        },
        error: function(myObject, error) {
            // The delete failed.
            // error is a Parse.Error with an error code and message.
            response.error("Error deleting user: " + request.user.id + ", error: " + error.message);
        }
    });
    
    // Friend Requests
    var queryFriendRequestUserFriend = new Parse.Query(constants.TableFriendRequest);
    queryFriendRequestUserFriend.equalTo(constants.ColumnFriendRequestUserFriendObjectId, userId);
    var queryFriendRequestUserRequested = new Parse.Query(constants.TableFriendRequest);
    queryFriendRequestUserRequested.equalTo(constants.ColumnFriendRequestUserRequestedObjectId, userId);
    
    var friendRequestDeletionComplete = false;
    Parse.Query.or(queryFriendRequestUserFriend, queryFriendRequestUserRequested)
    .find().then(function(objects) {
        return Parse.Object.destroyAll(objects);
    }).then(function(success) {
        friendRequestDeletionComplete = true;
        onAllDeletionsComplete();
        // The related comments were deleted
    }, function(error) {
        console.error("Error deleting user objects " + error.code + ": " + error.message);
    });
    
    // Touches
    var queryTouchUserFrom = new Parse.Query(constants.TableTouch);
    queryTouchUserFrom.equalTo(constants.ColumnTouchUserFromObjectId, userId);
    var queryTouchUserTo = new Parse.Query(constants.TableTouch);
    queryTouchUserTo.equalTo(constants.ColumnTouchUserToObjectId, userId);
    
    var touchesDeletionComplete = false;
    Parse.Query.or(queryTouchUserFrom, queryTouchUserTo)
    .find().then(function(objects) {
        return Parse.Object.destroyAll(objects);
    }).then(function(success) {
        touchesDeletionComplete = true;
        onAllDeletionsComplete();
        // The related comments were deleted
    }, function(error) {
        console.error("Error deleting user objects " + error.code + ": " + error.message);
    });
    
    // Touch Purchased
    var queryTouchPurchased = new Parse.Query(constants.TableTouchPurchase);
    queryTouchPurchased.equalTo(constants.ColumnTouchPurchaseUserObjectId, userId);
    
    var touchPurchasedDeletionComplete = false;
    queryTouchPurchased.find().then(function(objects) {
        return Parse.Object.destroyAll(objects);
    }).then(function(success) {
        touchPurchasedDeletionComplete = true;
        onAllDeletionsComplete();
        // The related comments were deleted
    }, function(error) {
        console.error("Error deleting user objects " + error.code + ": " + error.message);
    });
    
    var queryInstallation = new Parse.Query(constants.TableInstallation);
    queryInstallation.equalTo(constants.ColumnInstallationUser, request.user);
    
    var installationDeletionComplete = false;
    queryInstallation.find().then(function(objects) {
        return Parse.Object.destroyAll(objects);
    }).then(function(success) {
        installationDeletionComplete = true;
        onAllDeletionsComplete();
        // The related comments were deleted
    }, function(error) {
        console.error("Error deleting user objects " + error.code + ": " + error.message);
    });
});

// Call this with curl like so:
//curl -X POST -H "X-Parse-Application-Id: appid" -H "X-Parse-REST-API-Key: appkey" -H "Content-Type: application/json" -d ‘{"username": "admin", "password":"somepassword", "role":"some_role"}’ https://api.parse.com/1/functions/giveUserRole

Parse.Cloud.define('giveUserRole', function(req, response) {
    var role = _str.stripTags(req.params.role);
    if (!_.isString(role) || role.length === 0) {
        response.error('Role has not been provided');
        return;
    }
    loginUser(req.params.username, req.params.password, response, function() {
        // Do stuff after successful login.
        Parse.Cloud.useMasterKey();
        
        query = new Parse.Query(Parse.Role);
        query.equalTo("name", role);
        query.first ( {
        success: function(object) {
            object.relation("users").add(Parse.User.current());
            object.save();
        },
        error: function(error) {
            response.error("Got an error " + error.code + " : " + error.message);
        }
        });
    });
});

Parse.Cloud.define('doesCurrentUserHaveRole', function(req, response) {
    var role = _str.stripTags(req.params.role);
    if (!_.isString(role) || role.length === 0) {
        response.error('role has not been provided');
        return;
    }
    doesCurrentUserHaveRole(role, {
        success: function() {
            response.success('success');
        },
        failure: function() {
            response.error('error');
        }
    });
});

var loginUser = function(username, password, response, onSuccess) {
    username = _str.stripTags(username);
    password = _str.stripTags(password);
    if (!_.isString(username) || username.length === 0) {
        response.error('Username has not been provided');
        return;
    }
    if (!_.isString(password) || password.length === 0) {
        response.error('Password has not been provided');
        return;
    }
    
    Parse.User.logIn(username, password, {
        success: function(user) {
            onSuccess();
        },
        error: function(user, error) {
            response.error('invalid credentials');
        }
    });
};

var doesCurrentUserHaveRole = function(role, callbacks) {
    if (!_.isString(role) || role.length === 0) {
        // need a role!
        return false;
    }
    
    var queryRole = new Parse.Query(Parse.Role);
    queryRole.equalTo('name', role);
    queryRole.first({
    success: function(roleObj) { // Role Object
        var adminRelation = new Parse.Relation(roleObj, 'users');
        var queryAdmins = adminRelation.query();
        queryAdmins.equalTo('objectId', Parse.User.current().id);
        queryAdmins.first({
        success: function(user) {    // User Object
            if (user) {
                // they have the role
                callbacks.success();
            } else {
                // they don't have the role
                callbacks.failure();
            }
        }
        });
    },
    error: function(error) {
        callbacks.failure();
    }
    });
};


// Friend Request Queries

// Add FriendRequest for userFriendId
Parse.Cloud.define(constants.MethodNames.addFriendRequestForUserId, function(request, response) {
    var userId = _str.stripTags(request.user.id);
    var userFriendId = _str.stripTags(request.params.userFriendId);
    
    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo(constants.ColumnObjectId, userFriendId);
    userQuery.first({
        success: function(userFriend) {
            saveFriendRequest(userFriend);
        },
        error: function() {
            response.error("failed to lookup user: " + userFriendId);
        }
    });
    
    var saveFriendRequest = function(userFriend) {
        var query = new Parse.Query(constants.TableFriendRequest);
        query.equalTo(constants.ColumnFriendRequestUserRequestedObjectId, userId);
        query.equalTo(constants.ColumnFriendRequestUserFriendObjectId, userFriendId);
        query.count({
        success: function(count) {
            if (count === 0) {
                var FriendRequest = Parse.Object.extend(constants.TableFriendRequest);
                var friendRequest = new FriendRequest();
                
                var acl = new Parse.ACL();
                acl.setPublicReadAccess(true);
                acl.setPublicWriteAccess(true);
                
                friendRequest.setACL(acl);
                friendRequest.set(constants.ColumnFriendRequestUserRequested, request.user);
                friendRequest.set(constants.ColumnFriendRequestUserRequestedObjectId, request.user.id);
                friendRequest.set(constants.ColumnFriendRequestUserFriend, userFriend);
                friendRequest.set(constants.ColumnFriendRequestUserFriendObjectId, userFriend.id);
                friendRequest.set(constants.ColumnFriendRequestStatus, constants.ColumnDataFriendRequestStatusPending);
                
                friendRequest.save(null, {
                    success: function(friendRequest) {
                        response.success("Saved FriendRequest for UserRequested and UserFriend [" + request.user.id + ", " + userFriend.id + "]");
                    },
                    error: function(friendRequest, error) {
                        response.error("Failed to save FriendRequest for UserRequested and UserFriend [" + request.user.id + ", " + userFriend.id + "]");
                    }
                });
            } else {
                response.error("can't save friend request b/c there is already one!");
            }
        },
        error: function() {
            response.error("failed to lookup friendRequest with [userId, userFriendId]: " + userId + ", " + userFriendId);
        }
        });
    };
});

// Add FriendRequest for userFriendId
Parse.Cloud.define(constants.MethodNames.removeFriendRequestForUserId, function(request, response) {
    var userId = request.user.id;
    var userFriendId = _str.stripTags(request.params.userFriendId);
    
    var userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo(constants.ColumnObjectId, userFriendId);
    userQuery.first({
        success: function(userFriend) {
            destroyFriendRequest(userFriend);
        },
        error: function() {
            response.error("failed to lookup user: " + userFriendId);
        }
    });
    
    var destroyFriendRequest = function(userFriend) {
        var query = new Parse.Query(constants.TableFriendRequest);
        query.equalTo(constants.ColumnFriendRequestUserRequestedObjectId, userId);
        query.equalTo(constants.ColumnFriendRequestUserFriendObjectId, userFriendId);
        query.first({
            success: function(friendRequest) {
                friendRequest.destroy({
                    success: function(friendRequest) {
                        response.success("Successfully destroyed FriendRequest for UserRequested and UserFriend [" + request.user.id + ", " + userFriend.id + "]");
                    },
                    error: function(friendRequest, error) {
                        response.error("Failed to destroy FriendRequest for UserRequested and UserFriend [" + request.user.id + ", " + userFriend.id + "]");
                    }
                });
            },
            error: function() {
                response.error("no friendRequest exists to delete with [userId, userFriendId]: " + userId + ", " + userFriendId);
            }
        });
    };
});

// Set FriendRequest status to accepted for userFriendId
Parse.Cloud.define(constants.MethodNames.setFriendRequestStatusAcceptedForUserId, function(request, response) {
    _setFriendRequestStatusForUserIdAndUserFriendId(constants.ColumnDataFriendRequestStatusAccepted, response, request.user.id, _str.stripTags(request.params.userFriendId));
});

// Set FriendRequest status to denied for userFriendId
Parse.Cloud.define(constants.MethodNames.setFriendRequestStatusDeniedForUserId, function(request, response) {
    _setFriendRequestStatusForUserIdAndUserFriendId(constants.ColumnDataFriendRequestStatusDenied, response, request.user.id, _str.stripTags(request.params.userFriendId));
});

var _setFriendRequestStatusForUserIdAndUserFriendId = function(status, response, userId, userFriendId) {
    var query1 = new Parse.Query(constants.TableFriendRequest);
    query1.equalTo(constants.ColumnFriendRequestUserRequestedObjectId, userId);
    query1.equalTo(constants.ColumnFriendRequestUserFriendObjectId, userFriendId);
    
    var query2 = new Parse.Query(constants.TableFriendRequest);
    query2.equalTo(constants.ColumnFriendRequestUserRequestedObjectId, userFriendId);
    query2.equalTo(constants.ColumnFriendRequestUserFriendObjectId, userId);
    
    Parse.Query.or(query1, query2).first({
    success: function(friendRequest) {
        friendRequest.set(constants.ColumnFriendRequestStatus, status);
        friendRequest.save({
        success: function(friendRequest) {
            response.success("Successfully accepted FriendRequest for UserRequested and UserFriend [" + userId + ", " + userFriendId + "]");
        },
        error: function(friendRequest, error) {
            response.error("Failed to accept FriendRequest for UserRequested and UserFriend [" + userId + ", " + userFriendId + "]");
        }
        });
    },
    error: function() {
        response.error("no friendRequest exists to delete with [userId, userFriendId]: " + userId + ", " + userFriendId);
    }
    });
};

