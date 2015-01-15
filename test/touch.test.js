var should = require('chai').should(),
    _ = require('underscore'),
    Q = require('q'),
    constants = require('../cloud/constants.js'),
    testUtils = require('../test/TestUtils.js'),
    Parse = require('parse').Parse;

var timeoutMs = 9000;

Parse.initialize("PAMarLS2eyfYafzxzmcb7ztR4YeL3OvzOtrNeSnQ", "qRBeFXFMikrIGzESXDbcwfwR1tYxVHf2fQuQaakh");

describe('touch data setup', function() {
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

        it('have no touches to user', function(done) {
            Parse.Cloud.run(constants.MethodNames.getTouchesToUser, {}, {
                success: function(userTouches) {
                    // friends object should have 6 elements
                    _.keys(userTouches).length.should.equal(2);

                    userTouches.results.should.have.length(0);
                    userTouches.hasFriends.should.equal(false);
                    done();
                },
                error: function(error) {
                    testUtils.onTestFailure(error);
                }
            });
        });

        it('have no touches from user', function(done) {
            Parse.Cloud.run(constants.MethodNames.getTouchesFromUser, {}, {
            success: function(userTouches) {
                // friends object should have 6 elements
                _.keys(userTouches).length.should.equal(2);

                userTouches.results.should.have.length(0);
                userTouches.hasFriends.should.equal(false);
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('cannot touch a user that isnt our friend', function(done) {
            var nonCurrentUser = _.find(users, function(user) {
                return user.id !== Parse.User.current().id;
            });
           Parse.Cloud.run(constants.MethodNames.touchUser, {userToObjectId: nonCurrentUser.id, stepIndex: 0, touchTypeObjectId: _.first(touchTypes).id}, {
                success: function() {
                    testUtils.onTestFailure("shouldnt be able to touch a non-friend");
                },
                error: function(error) {
                    done();
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

        var touchMsDefault = 5000;
        it('can touch our friend', function(done) {
           Parse.Cloud.run(constants.MethodNames.touchUser, {userToObjectId: _.first(friends).id, stepIndex: 0, touchTypeObjectId: _.first(touchTypes).id}, {
                success: function() {
                    Parse.Cloud.run(constants.MethodNames.getTouchesFromUser, {}, {
                        success: function(userTouches) {
                            userTouches.results.should.have.length(1);
                            userTouches.hasFriends.should.equal(true);
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
        });

        it('can touch our friend with array method', function(done) {
           Parse.Cloud.run(constants.MethodNames.touchUsers, {userToObjectIds: [_.first(friends).id], stepIndex: 0, touchTypeObjectId: _.first(touchTypes).id}, {
                success: function() {
                    Parse.Cloud.run(constants.MethodNames.getTouchesFromUser, {}, {
                        success: function(userTouches) {
                            userTouches.results.should.have.length(2);
                            userTouches.hasFriends.should.equal(true);
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
        });

        it('can indeed touch our friend with a touchType we dont have', function(done) {
            Parse.Cloud.run(constants.MethodNames.touchUser, {userToObjectId: _.first(friends).id, stepIndex: 0, touchTypeObjectId: _.last(touchTypes).id}, {
                success: function() {
                    done();
                },
                error: function(error) {
                    testUtils.onTestFailure("should be able to touch with a touchType we don't have favorited");
                }
            });
        });

        it('can add another friend', function(done) {
            var friendUser = _.find(users, function(user) {
                return user.id !== Parse.User.current().id && _.isUndefined(_.find(friends, function(friend) {
                    return friend.id === user.id;
                }));
            });
            friends.push(friendUser);
            Parse.Cloud.run(constants.MethodNames.addFriendRequestForUserId, {userFriendId: friendUser.id}, {
                success: function() {
                    // set friend request as accepted for user id
                    Parse.Cloud.run(constants.MethodNames.setFriendRequestStatusAcceptedForUserId, {userFriendId: friendUser.id}, {
                        success: function() {
                            Parse.Cloud.run(constants.MethodNames.getFriends, {}, {
                                success: function(friends) {
                                    friends.results.should.have.length(2);
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

        it('can touch our friends with array method, again', function(done) {
           Parse.Cloud.run(constants.MethodNames.touchUsers, {
                userToObjectIds: _.map(friends, function(friend) {
                    return friend.id;
                }),
                stepIndex: 0,
                touchTypeObjectId: _.first(touchTypes).id
            }, {
                success: function() {
                    Parse.Cloud.run(constants.MethodNames.getTouchesFromUser, {}, {
                        success: function(userTouches) {
                            userTouches.results.should.have.length(5);
                            userTouches.hasFriends.should.equal(true);
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
        });

        it('can login as our first friend user and see their touches', function(done) {
            Parse.User.logOut();
            var user = _.first(friends);
            Parse.User.logIn(user.get("username"), user.get("password"), {
                success: function(user) {
                    Parse.Cloud.run(constants.MethodNames.getTouchesToUser, {}, {
                        success: function(userTouches) {
                            userTouches.results.should.have.length(4);
                            userTouches.hasFriends.should.equal(true);
                            done();
                        },
                        error: function(error) {
                            testUtils.onTestFailure(error);
                        }
                    });
                },
                error: function(user, error) {
                    testUtils.onTestFailure(error);
                }
            });
        });

        it('can remove all touches to or from our friends userId', function(done) {
            // this last user is who we were first logged in as (and whom this current user has touches with)
            Parse.Cloud.run(constants.MethodNames.removeTouchesToOrFromUser, {userFriendObjectId: _.last(users).id}, {
            success: function(user) {
                Parse.Cloud.run(constants.MethodNames.getTouchesToUser, {}, {
                success: function(userTouchesTo) {
                    userTouchesTo.results.should.have.length(0);
                    Parse.Cloud.run(constants.MethodNames.getTouchesFromUser, {}, {
                        success: function(userTouchesFrom) {
                            userTouchesFrom.results.should.have.length(0);
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

        it('can login as our second friend user and see their touches', function(done) {
            Parse.User.logOut();
            var user = _.last(friends);
            Parse.User.logIn(user.get("username"), user.get("password"), {
                success: function(user) {
                    Parse.Cloud.run(constants.MethodNames.getTouchesToUser, {}, {
                        success: function(userTouches) {
                            userTouches.results.should.have.length(1);
                            userTouches.hasFriends.should.equal(true);
                            done();
                        },
                        error: function(error) {
                            testUtils.onTestFailure(error);
                        }
                    });
                },
                error: function(user, error) {
                    testUtils.onTestFailure(error);
                }
            });
        });

        it('can remove all touches to or from our friends userId', function(done) {
            // this last user is who we were first logged in as (and whom this current user has touches with)
            Parse.Cloud.run(constants.MethodNames.removeTouchesToOrFromUser, {userFriendObjectId: _.last(users).id}, {
            success: function(user) {
                Parse.Cloud.run(constants.MethodNames.getTouchesToUser, {}, {
                success: function(userTouchesTo) {
                    userTouchesTo.results.should.have.length(0);
                    Parse.Cloud.run(constants.MethodNames.getTouchesFromUser, {}, {
                        success: function(userTouchesFrom) {
                            userTouchesFrom.results.should.have.length(0);
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
    });

});





