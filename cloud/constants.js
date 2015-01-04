
// Cloud code methods
exports.MethodNames = {
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
    unlockTouch: "unlockTouch",
    hideTouch: "hideTouch",
    deleteUser: "DeleteUser",
    removeTouchesToOrFromUser: "removeTouchesToOrFromUser",
    addFriendRequestForUserId: "addFriendRequestForUserId",
    removeFriendRequestForUserId: "removeFriendRequestForUserId",
    setFriendRequestStatusAcceptedForUserId: "setFriendRequestStatusAcceptedForUserId",
    setFriendRequestStatusDeniedForUserId: "setFriendRequestStatusDeniedForUserId"
};

exports.JobNames = {
    removeUnusedTouchTypes: "removeUnusedTouchTypes"
};

// Strings (time)

exports.TimeTypeMinutes = 'minutes';

// General

exports.NumResultsPerPage = 10;

exports.NumFreeTouches = 5;
exports.LockDurationNum = 30;
exports.LockDurationTimeType = exports.TimeTypeMinutes;

exports.TouchTypeDefault = "touch";

exports.SegueTouchPrompt = "touchPrompt";

exports.ColumnObjectId = "objectId";
exports.ColumnCreatedAt = "createdAt";
exports.ColumnUpdatedAt = "updatedAt";

// Installation

exports.TableInstallation = "Installation";
exports.ColumnInstallationUser = "user";

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

