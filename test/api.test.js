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

        it('should be two touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.getTouchTypes, {}, {
            success: function(objs) {
                objs.length.should.equal(touchTypes.length);
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        var touchTypePrivate;
        it('can create our own (private) touch type', function(done) {
            var TouchType = Parse.Object.extend(constants.TableTouchType);
            touchType = new TouchType();

            var touchTypeName = "my touch type";
            touchType.set(constants.ColumnTouchTypeName, touchTypeName);
            touchType.set(constants.ColumnTouchTypeBgColor, "#ffffff");
            touchType.set(constants.ColumnTouchTypeTextColor, "#777777");
            touchType.set(constants.ColumnTouchTypeIsDefault, false);
            touchType.set(constants.ColumnTouchTypeIsPrivate, true);
            // touchType.set(constants.ColumnTouchTypeCreatedByUser, Parse.User.current());
            touchType.set(constants.ColumnTouchTypeSteps, [
            {
                "durationMs": 2000,
                "textLong": "Give them a little hug",
                "textLongAfter": "Give them a little hug",
                "textNotif": "gave you a little hug",
                "textShort": "Touch"
            },
            {
                "durationMs": 2000,
                "textLong": "Give them a medium hug",
                "textLongAfter": "Give them a medium hug",
                "textNotif": "gave you a medium hug",
                "textShort": "Poke"
            },
            {
                "durationMs": 2000,
                "textLong": "Give them a long hug",
                "textLongAfter": "Give them a long hug",
                "textNotif": "gave you a long hug",
                "textShort": "Jab"
            }
            ]);

            touchType.save(null, {
                success: function(obj) {
                    touchTypePrivate = obj;
                    touchTypes.push(obj);
                    obj.get(constants.ColumnTouchTypeName).should.equal(touchTypeName);
                    done();
                },
                error: function(touchType, error) {
                    exports.onTestFailure(error);
                }
            });
        });

        it('should be one more touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.getTouchTypes, {}, {
            success: function(objs) {
                objs.length.should.equal(touchTypes.length);
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        it('can set our user touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.setUserTouchTypes, {touchTypeObjectIds: _.map(touchTypes, function(touchType) {
                // console.log("touchType.id: " + touchType.id);
                return touchType.id;
            })}, {
            success: function(userTouchTypes) {
                // userTouchTypes = _.each(userTouchTypes, function(userTouchType) {
                //     console.log("userTouchType.id: " + userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId]);
                // });
                userTouchTypes.length.should.equal(3);
                var userTouchType = userTouchTypes[0];
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(touchTypes[0].id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(0);

                userTouchType = userTouchTypes[1];
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(touchTypes[1].id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(1);

                userTouchType = userTouchTypes[2];
                userTouchType[constants.ColumnUserTouchTypeUserObjectId].should.equal(Parse.User.current().id);
                userTouchType[constants.ColumnUserTouchTypeTouchTypeObjectId].should.equal(touchTypes[2].id);
                userTouchType[constants.ColumnUserTouchTypeOrder].should.equal(2);

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

        it('should only have two touch types', function(done) {
            Parse.Cloud.run(constants.MethodNames.getUserTouchTypes, {}, {
            success: function(userTouchTypes) {
                userTouchTypes.length.should.equal(2);
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

        it('should not see the private touch the other user created', function(done) {
            Parse.Cloud.run(constants.MethodNames.getTouchTypes, {}, {
            success: function(objs) {
                _.isUndefined(_.find(objs, function(touchType) {
                    return touchType.id === touchTypePrivate.id;
                })).should.equal(true);
                done();
            },
            error: function(error) {
                testUtils.onTestFailure(error);
            }
            });
        });

        xit('shouldnt be able to delete the private touch type', function(done) {
            Parse.Promise.when(touchTypePrivate.destroy()).then(function() {
                testUtils.onTestFailure("shouldnt have been able to delete this!");
            }, function() {
                // error (good!)
                done();
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

        it('can login as our initial friend user so we can delete all touch types', function(done) {
            Parse.User.logOut();
            var user = _.last(friends);
            Parse.User.logIn(user.get("username"), user.get("password"), {
                success: function(user) {
                    done();
                },
                error: function(user, error) {
                    testUtils.onTestFailure(error);
                }
            });
        });
    });

});





