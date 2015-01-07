var _ = require('underscore');

// every release of our server code here must increment this number
// and that increased number must match what the client app uses
exports.VersionNumber = 1;

var getVersionedMethodName = function(name) {
    return name + "_" + exports.VersionNumber;
};

// Cloud code methods (with version numbers appended)
exports.MethodNames = _.object(_.map({
    getFriendsAndTouches: "getFriendsAndTouches",
    getFriends: "getFriends",
    getFriendsWithTouches: "getFriendsWithTouches",
    getFriendDetails: "getFriendDetails",
    getTouchesToUser: "getTouchesToUser",
    getTouchesFromUser: "getTouchesFromUser",
    getTouchTypes: "getTouchTypes",
    getCreatedTouchTypes: "getCreatedTouchTypes",
    getNewestTouchTypes: "getNewestTouchTypes",
    getPopularTouchTypes: "getPopularTouchTypes",
    getUserTouchTypes: "getUserTouchTypes",
    setUserTouchTypes: "setUserTouchTypes",
    removeUserTouchTypes: "removeUserTouchTypes",
    addUserTouchType: "addUserTouchType",
    removeUserTouchType: "removeUserTouchType",
    purchaseTouches: "purchaseTouches",
    touchUser: "touchUser",
    touchUsers: "touchUsers",
    unlockTouch: "unlockTouch",
    hideTouch: "hideTouch",
    deleteUser: "DeleteUser",
    removeTouchesToOrFromUser: "removeTouchesToOrFromUser",
    addFriendRequestForUserId: "addFriendRequestForUserId",
    removeFriendRequestForUserId: "removeFriendRequestForUserId",
    setFriendRequestStatusAcceptedForUserId: "setFriendRequestStatusAcceptedForUserId",
    setFriendRequestStatusDeniedForUserId: "setFriendRequestStatusDeniedForUserId"
}, function (value, key) {
    return [key, getVersionedMethodName(value)];
}));

exports.JobNames = {
    removeUnusedTouchTypes: "removeUnusedTouchTypes"
};

// Strings (time)

exports.TimeTypeMinutes = 'minutes';

// General

exports.NumResultsPerPage = 30;

exports.TouchTypeDefault = "touch";

exports.SegueTouchPrompt = "touchPrompt";

exports.ColumnObjectId = "objectId";
exports.ColumnCreatedAt = "createdAt";
exports.ColumnUpdatedAt = "updatedAt";

// Installation

exports.TableInstallation = "Installation";
exports.ColumnInstallationUser = "user";
exports.ColumnInstallationBadge = "badge";

// TouchPurchase

exports.TableTouchPurchase = "TouchPurchase";
exports.ColumnTouchPurchaseUserObjectId = "userObjectId";
exports.ColumnTouchPurchaseUsed = "used";
exports.ColumnTouchPurchaseBlockPurchasedAt = "blockPurchasedAt";
exports.ColumnTouchPurchaseTotalPurchased = "totalPurchased";
exports.ColumnTouchPurchaseNum = "num";
exports.ColumnTouchPurchaseUsedAt = "usedAt";
exports.TouchPurchaseParamNumTouches = "numTouches";

// User

exports.TableUser = "User";
exports.ColumnUserExtraTouches = "extraTouches";
exports.ColumnUserUsername = "username";
exports.ColumnUserTouchTypes = "touchTypes";

// FriendRequest

exports.TableFriendRequest = "FriendRequest";

exports.ColumnFriendRequestUserFriend = "UserFriend";
exports.ColumnFriendRequestUserRequested = "UserRequested";
exports.ColumnFriendRequestUserFriendObjectId = "UserFriendObjectId";
exports.ColumnFriendRequestUserRequestedObjectId = "UserRequestedObjectId";
exports.ColumnFriendRequestStatus = "status";

exports.ColumnDataFriendRequestStatusPending = "pending";
exports.ColumnDataFriendRequestStatusAccepted = "accepted";
exports.ColumnDataFriendRequestStatusDenied = "denied";

// Touch

exports.TableTouch = "Touch";

exports.ColumnTouchUserFrom = "UserFrom";
exports.ColumnTouchUserFromObjectId = "UserFromObjectId";
exports.ColumnTouchUserTo = "UserTo";
exports.ColumnTouchUserToObjectId = "UserToObjectId";
exports.ColumnTouchDuration = "duration";
exports.ColumnTouchTypeObjectId = "touchTypeObjectId";
exports.ColumnTouchUnlocked = "unlocked";
exports.ColumnTouchUsedExtraTouchToTouch = "usedExtraTouchToTouch";
exports.ColumnTouchUsedExtraTouchToUnlock = "usedExtraTouchToUnlock";
exports.ColumnTouchHideForUserTo = "hideForUserTo";
exports.ColumnTouchHideForUserFrom = "hideForUserFrom";

// TouchType

exports.TableTouchType = "TouchType";
exports.ColumnTouchTypeName = "name";
exports.ColumnTouchTypeBgColor = "bgColor";
exports.ColumnTouchTypeTextColor = "textColor";
exports.ColumnTouchTypeSteps = "steps";
exports.ColumnTouchTypeCreatedByUser = "createdByUser";
exports.ColumnTouchTypeCreatedByUserId = "createdByUserId";
exports.ColumnTouchTypeIsDefault = "isDefault";
exports.ColumnTouchTypeIsPrivate = "isPrivate";

// UserTouchType

exports.TableUserTouchType = "UserTouchType";
exports.ColumnUserTouchTypeUser = "user";
exports.ColumnUserTouchTypeUserObjectId = "userObjectId";
exports.ColumnUserTouchTypeTouchType = "touchType";
exports.ColumnUserTouchTypeTouchTypeObjectId = "touchTypeObjectId";
exports.ColumnUserTouchTypeOrder = "order";

