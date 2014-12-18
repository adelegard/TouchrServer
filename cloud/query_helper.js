
var constants = require('cloud/constants');
var moment = require('moment');
var _ = require('underscore');

// Local helper methods (to the other (exported) helper methods in this file)

var isTrueStringOrBoolean = function(val) {
    return val === "true" || val === true;
};

var getResultsObject = function(results, user, friends) {
    var _obj = {
        results: results,
        hasFriends: _.isArray(friends) && friends.length > 0
    };
    return _obj;
};

var getQueryWithPaging = function(query, page) {
    if (_.isNumber(page) && page > 0) {
        if (page-1 > 0) {
            var skipNum = (page-1) * constants.NumResultsPerPage;
            query.skip(skipNum);
        }
        query.limit(constants.NumResultsPerPage);
    }
    return query;
};

exports.getTouchTypesQuery = function() {
    return new Parse.Query(Parse.Object.extend(constants.TableTouchType));
};

exports.getNewUserTouchTypeQueryWithUserAndTouchTypeAndOrder = function(user, touchType, order) {
    var UserTouchType = Parse.Object.extend(constants.TableUserTouchType);
    var userTouchType = new UserTouchType();
    userTouchType.set(constants.ColumnUserTouchTypeUser, user);
    userTouchType.set(constants.ColumnUserTouchTypeUserObjectId, user.id);
    userTouchType.set(constants.ColumnUserTouchTypeTouchType, touchType);
    userTouchType.set(constants.ColumnUserTouchTypeTouchTypeObjectId, touchType.id);
    userTouchType.set(constants.ColumnUserTouchTypeOrder, order);
    return userTouchType;
};

exports.getUserTouchTypesQuery = function() {
    var query = new Parse.Query(Parse.Object.extend(constants.TableUserTouchType));
    query.equalTo(constants.ColumnUserTouchTypeUser, Parse.User.current());
    query.ascending(constants.ColumnUserTouchTypeOrder);
    query.include(constants.ColumnUserTouchTypeTouchType);
    return query;
};

exports.getUserTouchTypeQueryLargestOrder = function() {
    var query = new Parse.Query(Parse.Object.extend(constants.TableUserTouchType));
    query.equalTo(constants.ColumnUserTouchTypeUser, Parse.User.current());
    query.descending(constants.ColumnUserTouchTypeOrder);
    query.limit(1);
    return query;
};

exports.getUserTouchTypesQueryForTouchTypeId = function(touchTypeId) {
    var query = exports.getUserTouchTypesQuery();
    query.equalTo(constants.ColumnUserTouchTypeUser, Parse.User.current());
    query.equalTo(constants.ColumnUserTouchTypeTouchTypeObjectId, touchTypeId);
    return query;
};

exports.getDefaultTouchTypeQuery = function() {
    var query = exports.getTouchTypesQuery();
    query.equalTo(constants.ColumnTouchTypeIsDefault, true);
    return query;
};

exports.getTouchTypeQueryForTouchTypeId = function(touchTypeId) {
    var query = exports.getTouchTypesQuery();
    query.equalTo(constants.ColumnObjectId, touchTypeId);
    return query;
};

exports.getTouchTypeQueryForTouchTypeIds = function(touchTypeIds) {
    var query = exports.getTouchTypesQuery();
    query.containedIn(constants.ColumnObjectId, touchTypeIds);
    return query;
};

exports.getTouchesToUserQuery = function(user, page) {
    var query = new Parse.Query(Parse.Object.extend(constants.TableTouch));
    query.equalTo(constants.ColumnTouchUserTo, user);
    query.notEqualTo(constants.ColumnTouchHideForUserTo, true);
    query.descending(constants.ColumnCreatedAt);
    return getQueryWithPaging(query, page);
};

exports.getTouchesToUserWithFriends = function(user, touchesToYou, friends, touchTypes) {
    touchesToYou = _.filter(touchesToYou, function(touchToYou) {
        var userId = touchToYou.get(constants.ColumnTouchUserFromObjectId);
        return !_.isUndefined(_.find(friends, function(friend) {
            return friend.id === userId;
        }));
    });
    return getResultsObject(_.map(touchesToYou, function(touchToYou) {
        var userId = touchToYou.get(constants.ColumnTouchUserFromObjectId);
        var touchType = _.find(touchTypes, function(touchType) {
            return touchType.objectId === touchToYou.get(constants.ColumnTouchTypeObjectId);
        });
        return {
            id: touchToYou.id,
            user: _.find(friends, function(friend) {
                return friend.id === userId;
            }),
            touchType: _.isUndefined(touchType) ? {} : {
                bgColor: touchType.bgColor,
                textColor: touchType.textColor,
                step: exports.getMatchingTouchTypeStepForTouchDuration(touchType[constants.ColumnTouchTypeSteps], touchToYou.get(constants.ColumnTouchDuration))
            },
            touchCreatedAt: moment(touchToYou[constants.ColumnCreatedAt]).unix(),
            touchDuration: touchToYou.get(constants.ColumnTouchDuration)
        };
    }), user, friends);
};

exports.getTouchesFromUserWithFriends = function(user, touchesFromYou, friends, touchTypes) {
    touchesFromYou = _.filter(touchesFromYou, function(touchFromYou) {
        var userId = touchFromYou.get(constants.ColumnTouchUserToObjectId);
        return !_.isUndefined(_.find(friends, function(friend) {
            return friend.id === userId;
        }));
    });
    return getResultsObject(_.map(touchesFromYou, function(touchFromYou) {
        var userId = touchFromYou.get(constants.ColumnTouchUserToObjectId);
        var touchType = _.find(touchTypes, function(touchType) {
            return touchType.objectId === touchFromYou.get(constants.ColumnTouchTypeObjectId);
        });
        return {
            id: touchFromYou.id,
            user: _.find(friends, function(friend) {
                return friend.id === userId;
            }),
            touchType: _.isUndefined(touchType) ? {} : {
                bgColor: touchType.bgColor,
                textColor: touchType.textColor,
                step: exports.getMatchingTouchTypeStepForTouchDuration(touchType[constants.ColumnTouchTypeSteps], touchFromYou.get(constants.ColumnTouchDuration))
            },
            touchCreatedAt: moment(touchFromYou[constants.ColumnCreatedAt]).unix(),
            touchDuration: touchFromYou.get(constants.ColumnTouchDuration)
        };
    }), user, friends);
};

exports.getMatchingTouchTypeStepForTouchDuration = function(touchTypeSteps, durationMs) {
    durationMs = parseInt(durationMs, 10);
    return _.find(touchTypeSteps, function(touchTypeStep) {
        var maxMs = parseInt(touchTypeStep.maxMs, 10);
        return parseInt(touchTypeStep.minMs, 10) <= durationMs && (maxMs > durationMs || (!_.isNumber(maxMs) || _.isNaN(maxMs)));
    });
};

exports.getQueryAllUserFriendsForUser = function(user, page) {
    var queryFriendRequestUser = new Parse.Query(Parse.Object.extend(constants.TableFriendRequest));
    queryFriendRequestUser.equalTo(constants.ColumnFriendRequestUserFriend, user);
    queryFriendRequestUser.equalTo(constants.ColumnFriendRequestStatus, constants.ColumnDataFriendRequestStatusAccepted);
    
    var queryFriendRequestRequested = new Parse.Query(Parse.Object.extend(constants.TableFriendRequest));
    queryFriendRequestRequested.equalTo(constants.ColumnFriendRequestUserRequested, user);
    queryFriendRequestRequested.equalTo(constants.ColumnFriendRequestStatus, constants.ColumnDataFriendRequestStatusAccepted);
    
    var usersRequestedQuery = new Parse.Query(Parse.User);
    usersRequestedQuery.matchesKeyInQuery(constants.ColumnObjectId, constants.ColumnFriendRequestUserRequestedObjectId, queryFriendRequestUser);
    
    var usersFriendsQuery = new Parse.Query(Parse.User);
    usersFriendsQuery.matchesKeyInQuery(constants.ColumnObjectId, constants.ColumnFriendRequestUserFriendObjectId, queryFriendRequestRequested);
    
    return getQueryWithPaging(Parse.Query.or(usersRequestedQuery, usersFriendsQuery), page);
};

exports.getQueryTouchesToOrFrom = function(user, userFriendObjectId) {
    return Parse.Query.or(exports.getQueryTouchesFrom(user, userFriendObjectId), exports.getQueryTouchesTo(user, userFriendObjectId));
};

exports.getQueryTouchesTo = function(user, userFriendObjectId) {
    var queryUserTo = new Parse.Query(Parse.Object.extend(constants.TableTouch));
    queryUserTo.equalTo(constants.ColumnTouchUserTo, user);
    queryUserTo.equalTo(constants.ColumnTouchUserFromObjectId, userFriendObjectId);
    return queryUserTo;
};

exports.getQueryTouchesFrom = function(user, userFriendObjectId) {
    var queryUserFrom = new Parse.Query(Parse.Object.extend(constants.TableTouch));
    queryUserFrom.equalTo(constants.ColumnTouchUserFrom, user);
    queryUserFrom.equalTo(constants.ColumnTouchUserToObjectId, userFriendObjectId);
    return queryUserFrom;
};

exports.getAllUserFriends = function(user, friends) {
    return getResultsObject(_.map(friends, function(friend) {
        return {
            user: friend
        };
    }), user, friends);
};

exports.getTouchesFromUserQuery = function(user, page) {
    var queryAllUserFriendsForUser = exports.getQueryAllUserFriendsForUser(user);
    
    var touchQuery = new Parse.Query(Parse.Object.extend(constants.TableTouch));
    touchQuery.equalTo(constants.ColumnTouchUserFrom, user);
    touchQuery.notEqualTo(constants.ColumnTouchHideForUserFrom, true);
    touchQuery.matchesKeyInQuery(constants.ColumnTouchUserToObjectId, constants.ColumnObjectId, queryAllUserFriendsForUser);
    touchQuery.descending(constants.ColumnCreatedAt);
    return getQueryWithPaging(touchQuery, page);
};

