
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

exports.getTouchTypesQuery = function(user, page) {
    var queryNonPrivate = new Parse.Query(Parse.Object.extend(constants.TableTouchType));
    queryNonPrivate.equalTo(constants.ColumnTouchTypeIsPrivate, false);

    var queryPrivate = new Parse.Query(Parse.Object.extend(constants.TableTouchType));
    queryPrivate.equalTo(constants.ColumnTouchTypeIsPrivate, true);
    queryPrivate.equalTo(constants.ColumnTouchTypeCreatedByUserId, user.id);

    var query = Parse.Query.or(queryNonPrivate, queryPrivate);
    query.include(constants.ColumnTouchTypeCreatedByUser);
    return getQueryWithPaging(query, page);
};

exports.getCreatedTouchTypesQuery = function(userId, page, includePrivate) {
    var query = new Parse.Query(Parse.Object.extend(constants.TableTouchType));
    query.equalTo(constants.ColumnTouchTypeCreatedByUserId, userId);
    query.include(constants.ColumnTouchTypeCreatedByUser);

    if (!includePrivate) {
        query.equalTo(constants.ColumnTouchTypeIsPrivate, false);
    }

    return getQueryWithPaging(query, page);
};

exports.getNewestTouchTypesQuery = function(user, page) {
    var query = exports.getTouchTypesQuery(user, page);
    query.descending(constants.ColumnCreatedAt);
    return getQueryWithPaging(query, page);
};

exports.getPopularTouchTypesQuery = function(user, page) {
    var query = exports.getTouchTypesQuery(user, page);
    // order by most used or something??
    return getQueryWithPaging(query, page);
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
    query.include([constants.ColumnUserTouchTypeTouchType + "." + constants.ColumnTouchTypeCreatedByUser]);
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

exports.getTouchTypeQueryForTouchTypeId = function(user, touchTypeId) {
    var query = exports.getTouchTypesQuery(user);
    query.equalTo(constants.ColumnObjectId, touchTypeId);
    return query;
};

exports.getTouchTypeQueryForTouchTypeIds = function(user, touchTypeIds) {
    var query = exports.getTouchTypesQuery(user);
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
                step: touchType[constants.ColumnTouchTypeSteps][touchToYou.get(constants.ColumnTouchStepIndex)]
            },
            touchCreatedAt: moment(touchToYou[constants.ColumnCreatedAt]).unix()
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
                step: touchType[constants.ColumnTouchTypeSteps][touchFromYou.get(constants.ColumnTouchStepIndex)]
            },
            touchCreatedAt: moment(touchFromYou[constants.ColumnCreatedAt]).unix()
        };
    }), user, friends);
};

var getQueryAllUserFriendsForUser = function(user) {
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

    var usersQuery = Parse.Query.or(usersRequestedQuery, usersFriendsQuery);
    usersQuery.ascending(constants.ColumnUserUsername);
    return usersQuery;
};

exports.getQueryAllUserFriendsForUser = function(user, page) {
    return getQueryWithPaging(getQueryAllUserFriendsForUser(user), page);
};

exports.getQueryUserFriendWithUserIdForUser = function(userId, user) {
    var query = getQueryAllUserFriendsForUser(user);
    query.equalTo(constants.ColumnObjectId, userId);
    return query;
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

