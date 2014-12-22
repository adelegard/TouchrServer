var should = require('chai').should(),
    _ = require('underscore'),
    Q = require('q'),
    constants = require('../cloud/constants.js'),
    testUtils = require('../test/TestUtils.js'),
    Parse = require('parse').Parse;

var timeoutMs = 9000;

Parse.initialize("PAMarLS2eyfYafzxzmcb7ztR4YeL3OvzOtrNeSnQ", "qRBeFXFMikrIGzESXDbcwfwR1tYxVHf2fQuQaakh");

describe('Authentication', function() {
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
        testUtils.destroyTouchTypes();
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
        
        var touchMsDefault = 5000;
        var numTouches = 0;
        it('can touch our friend', function(done) {
           Parse.Cloud.run(constants.MethodNames.touchUser, {userToObjectId: _.first(friends).id, durationMs: touchMsDefault, touchTypeObjectId: _.first(touchTypes).id}, {
                success: function() {
                    numTouches++;
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
        
        it('cannot touch our friend with a touchType we dont have', function(done) {
            Parse.Cloud.run(constants.MethodNames.touchUser, {userToObjectId: _.first(friends).id, durationMs: 1, touchTypeObjectId: _.last(touchTypes).id}, {
                success: function() {
                    testUtils.onTestFailure("shouldnt be able to touch with a touchType we don't have");
                },
                error: function(error) {
                    done();
                }
            });
        });
        
        it('cannot add a touch type we already have', function(done) {
            Parse.Cloud.run(constants.MethodNames.addUserTouchType, {touchTypeObjectId: _.first(touchTypes).id}, {
            success: function() {
                testUtils.onTestFailure("shouldn't have been able to add this touch type");
            },
            error: function(error) {
                done();
            }
            });
        });

        it('can get our user touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.getUserTouchTypes, {}, {
            success: function(userTouchTypes) {
                userTouchTypes.length.should.equal(1);
                var userTouchType = _.first(userTouchTypes);
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
//                userTouchType[constants.ColumnUserTouchTypeTouchType][constants.ColumnObjectId].should.equal(_.first(touchTypes).id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(_.first(touchTypes).id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(1);
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('can add a touch type we dont have', function(done) {
            Parse.Cloud.run(constants.MethodNames.addUserTouchType, {touchTypeObjectId: _.last(touchTypes).id}, {
            success: function(userTouchType) {
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(_.last(touchTypes).id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(2);
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('can get our user touch types after adding one', function(done) {
            Parse.Cloud.run(constants.MethodNames.getUserTouchTypes, {}, {
            success: function(userTouchTypes) {
                userTouchTypes.length.should.equal(2);
                var userTouchType = _.first(userTouchTypes);
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(_.first(touchTypes).id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(1);
                
                userTouchType = _.last(userTouchTypes);
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(_.last(touchTypes).id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(2);

                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('can remove all touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.removeUserTouchTypes, {}, {
            success: function() {
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('shouldnt have any user touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.getUserTouchTypes, {}, {
            success: function(userTouchTypes) {
                userTouchTypes.length.should.equal(0);
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('can set our user touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.setUserTouchTypes, {touchTypeObjectIds: _.map(touchTypes, function(touchType) {
                console.log("touchType.id: " + touchType.id);
                return touchType.id;
            })}, {
            success: function(userTouchTypes) {
                userTouchTypes = _.each(userTouchTypes, function(userTouchType) {
                    console.log("userTouchType.id: " + userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId]);
                });
                userTouchTypes.length.should.equal(2);
                var userTouchType = _.first(userTouchTypes);
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(_.first(touchTypes).id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(0);

                userTouchType = _.last(userTouchTypes);
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(_.last(touchTypes).id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(1);

                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('can remove one user touch type', function(done) {
            Parse.Cloud.run(constants.MethodNames.removeUserTouchType, {touchTypeObjectId: _.last(touchTypes).id}, {
            success: function() {
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('should only have one touch type', function(done) {
            Parse.Cloud.run(constants.MethodNames.getUserTouchTypes, {}, {
            success: function(userTouchTypes) {
                userTouchTypes.length.should.equal(1);
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
                    friendDetails.numTouchesTo.should.equal(numTouches);
                    friendDetails.numTouchesFrom.should.equal(0);
                    friendDetails.touchesToMs.should.equal(numTouches * touchMsDefault);
                    friendDetails.touchesFromMs.should.equal(0);
                    done();
                },
                error: function(error) {
                    testUtils.onTestFailure(error);
                }
            });
        });

        it('can login as our friend user and see their touches', function(done) {
            Parse.User.logOut();
            var user = _.first(friends);
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





