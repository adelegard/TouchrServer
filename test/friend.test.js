var should = require('chai').should(),
    _ = require('underscore'),
    Q = require('q'),
    constants = require('../cloud/constants.js'),
    testUtils = require('../test/TestUtils.js'),
    Parse = require('parse').Parse;

var timeoutMs = 9000;

Parse.initialize("PAMarLS2eyfYafzxzmcb7ztR4YeL3OvzOtrNeSnQ", "qRBeFXFMikrIGzESXDbcwfwR1tYxVHf2fQuQaakh");

describe('friend tests data setup', function() {
    var users;
    var touchTypes;

    before(function (done) {
        this.timeout(timeoutMs);
        testUtils.setupData().then(function(obj) {
            users = obj.users;
            touchTypes = obj.touchTypes;
            done();
        });
    });

    after(function (done) {
        this.timeout(timeoutMs);
        testUtils.destroyTestUsers(done);
    });

    describe('authenticated requests', function() {
        this.timeout(timeoutMs);

        it('have no friends', function(done) {
            Parse.Cloud.run(constants.MethodNames.getFriends, {}, {
                success: function(friends) {
                    // friends object should have 6 elements
                    _.keys(friends).length.should.equal(2);

                    friends.results.should.have.length(0);
                    friends.hasFriends.should.equal(false);
                    done();
                },
                error: function(error) {
                    testUtils.onTestFailure(error);
                }
            });
        });

        var friends = [];

        it('can add a single friend', function(done) {
            var friendUser = _.find(users, function(user) {
                return user.id !== Parse.User.current().id;
            });
            friends.push(friendUser);
            Parse.Cloud.run(constants.MethodNames.addFriendRequestForUserId, {userFriendId: friendUser.id}, {
                success: function() {
                    // set friend request as accepted for user id
                    Parse.Cloud.run(constants.MethodNames.setFriendRequestStatusAcceptedForUserId, {userFriendId: friendUser.id}, {
                        success: function() {
                            Parse.Cloud.run(constants.MethodNames.getFriends, {}, {
                                success: function(friends) {
                                    friends.results.should.have.length(1);
                                    friends.hasFriends.should.equal(true);
                                    done();
                                },
                                error: function(error) {
                                    testUtils.onTestFailure(error);
                                }
                            });
                        },
                        error: function(error) {
                            testUtils.onTestFailure(error);
                        }
                    });
                },
                error: function(error) {
                    testUtils.onTestFailure(error);
                }
            });
        });

        it('still have one friend', function(done) {
            Parse.Cloud.run(constants.MethodNames.getFriends, {}, {
                success: function(friends) {
                    friends.results.should.have.length(1);
                    friends.hasFriends.should.equal(true);
                    done();
                },
                error: function(error) {
                    testUtils.onTestFailure(error);
                }
            });
        });

        it('can get our friend details', function(done) {
            Parse.Cloud.run(constants.MethodNames.getFriendDetails, {userFriendObjectId: _.first(friends).id}, {
                success: function(friendDetails) {
                    //numTouchesTo
                    //numTouchesFrom
                    //touchesToMs
                    //touchesFromMs
                    _.keys(friendDetails).length.should.equal(4);
                    friendDetails.numTouchesTo.should.equal(0);
                    friendDetails.numTouchesFrom.should.equal(0);
                    friendDetails.touchesToMs.should.equal(0);
                    friendDetails.touchesFromMs.should.equal(0);
                    done();
                },
                error: function(error) {
                    testUtils.onTestFailure(error);
                }
            });
        });
    });

});

