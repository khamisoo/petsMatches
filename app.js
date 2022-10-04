// -  -------------    required paceges   ------------------
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const fs = require('fs');
const path = require('path');
const script = require('./public/index.js');
const cityData = require("./city.json");
const govurnementData = require("./govurnement.json");
const http = require('node:http');


// --                            -------      access files Ejs / static files      ------------
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use('/uploads', express.static('uploads'));

// -----------------------------      sessiion setup ---------------------------------

app.use(session({
  secret: "our littel secret",
  resave: false,
  saveUnitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// --------------                             Data Base connection and plugin   ------------
mongoose.connect("mongodb+srv://admin-khamis:test123@cluster0.fx1mhof.mongodb.net/petsMatches");

//--                                        --   FS setup with MULTER for UPloading ----------------



const PetPic = require('./public/index.js');

//  ------------- ----------------------------------------------------------------
// -- USER DB encryptedd  by session and passport
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id)
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });

});


//----------------------------------- GOOGLE SIGN IN WITH ITS GET PAGES ------------------------------------
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://petsmatches.com/auth/google/local",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({
    googleId: profile.id,
    username: profile.displayName
  }, function(err, user) {
    return cb(err, user);
  });
  //  console.log(profile);
}));

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get('/auth/google/local',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {

    res.redirect('/api');
  });


//----------------------------------- FACEBOOK SIGN IN WITH ITS GET PAGES ------------------------------------
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://petsmatches.com/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      username: profile.displayName,
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
    //  console.log(profile);
  }
));
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/api');
  });


//-                 ------------------------------------------------------------------

// schemaa for Profile user //  petss =>> pics shemaa in index.js

const personSchema = new mongoose.Schema({
  login_userDB_id: {
    type: String,
    required: [true],
    index: [true],
  },
  dateOfBirth: Number,
  fullName: {
    type: String,
    required: [true],
    index: [true],
  },
  email: String,
  phone: Number,
  numberValidation: String,
  acceptingPolicy: String,
  enterpriceUser: {
    type: Boolean,
    default: false,
  },
  signUpMethod: {
    type: Number,
    min: 0,
    max: 4
  }, // {0 -> Normal Email signup OR  1 -> Google Signup OR 2 -> Facebook Signup}
  accountStatus: String, // {0 -> Global Admin OR 1-> Moderator OR 2 -> User OR -1 -> Suspended}
  governorate_name: String,
  city_name: String,
  img: {
    data: Buffer,
    imageID: String,
    ImageLink: String
  },
  Photo_URL: String, //{/uploades/soertelbaniadamelgamedneek.png}
  facebookID: String,
  GoogleID: String,
});
const Person = mongoose.model("People", personSchema);

const petSchema = new mongoose.Schema({
  petPic_Link: String,
  petPic_id: String,
  userID: String,
  category: String,
  age: Number,
  Health: String,
  SpecialMarks: String,

});
const Pet = mongoose.model("Pets", petSchema);

const govurnementSchema = new mongoose.Schema({
  id: String,
  governorate_name_ar: String,
  governorate_name_en: String
});
const Govurnement = mongoose.model("Govurnements", govurnementSchema);

const citySchema = new mongoose.Schema({
  id: String,
  governorate_id: String,
  city_name_ar: String,
  city_name_en: String
});
const City = mongoose.model("Cities", citySchema);

const govurnementDb = govurnementData[2].data;
const cityDb = cityData[1].data;

const mailSchema = new mongoose.Schema({
  inbox: {
    reciver: {
      reciver_UserDb_ID: String,
      messageReciver: [{
        type: String,
        required: [true],
        index: [true],
      }],
      created_at: {
        type: Date,
        default: Date.now
      },
      msgFormat: String,
      is_Read: {
        type: Boolean,
        default: false,
      },
      is_Delete: {
        type: Boolean,
        default: false,
      },
      is_edited: {
        type: Boolean,
        default: false,
      },
      startingChat: {
        type: Date,
        default: Date.now
      },
      online: {
        type: Number,
        min: 1,
        max: 2
      },
      block: {
        type: Number,
        min: 0,
        max: 3
      }
    },
    creator: {
      sender_User_Id: String,
      chat_ID: String,
      messageCreated: [{
        type: String,
        required: [true],
        index: [true],
      }],
      created_at: {
        type: Date,
        default: Date.now
      },
      msgFormat: String,
      is_Read: {
        type: Boolean,
        default: false,
      },
      is_Delete: {
        type: Boolean,
        default: false,
      },
      is_edited: {
        type: Boolean,
        default: false,
      },
      startingChat: {
        type: Date,
        default: Date.now
      },
      online: {
        type: Number,
        min: 1,
        max: 2
      },
      block: {
        type: Number,
        min: 0,
        max: 3
      }
    }
  }
});
const Mail = mongoose.model("Mails", mailSchema);

const followerSchema = new mongoose.Schema({
  personDb_id: String,
  followers_user: [String]
});
const Follower = mongoose.model("followers", followerSchema);

const followingSchema = new mongoose.Schema({
  personDb_id: String,
  following_users: [String]
});
const Following = mongoose.model("Followings", followingSchema);

const noteficationSchema = new mongoose.Schema({
  eventCreator: String,
  reciver: String,
  type: String,
  name: String,
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now
  },
});

const Notefication = mongoose.model("Notefications", noteficationSchema);

//------------------------------- ROUTES . get ----------------------------------------------------------

app.get("/", function(req, res) {
  res.render("home");
});


app.get("/termsandconditions", function(req, res) {
  res.render("termsandconditions");


});


app.get("/register", function(req, res) {

  res.render("register");

});


app.get("/login", function(req, res) {

  res.render("login");

});


app.get("/profile/:id", function(req, res) {
  if (req.isAuthenticated()) {
    req.params.Id = req.user._id;

    function dataInsert() {
      const govurnementDbIs = Govurnement.insertMany(govurnementDb, (err, gov_data) => {
        if (err) {
          console.log(err);
        } else {
          gov_data.forEach((docs) => {
            //  console.log(docs);
          });
        }
      });
      const cityDbIs = City.insertMany(cityDb, (err, city_data) => {
        if (err) {
          console.log(err);
        } else {
          city_data.forEach((cities) => {
            //console.log(cities);
          });
        }
      });
    }
    Govurnement.find({}, (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        if (docs.length <= 0) {
          dataInsert();
        } else {
          //console.log(docs);
          res.render("profile", {
            govData: docs,
            paramID: req.user._id
          });
        }
      }
    });

  } else {
    res.redirect("/login");
  }

});


app.route("/city/:dataId")
  .get(function(req, res) {
    Govurnement.findOne({
      governorate_name_en: req.params.dataId
    }, function(err, docs) {
      if (err) {
        console.log(err);
      } else {
        //  console.log(docs)
        City.find({
          governorate_id: docs.id
        }, (err, found) => {
          if (err) {
            console.log(err)
          } else {
            //console.log(found);
            res.send(found)
          }
        });
      }
    });
  })


app.get("/find", function(req, res) {
  if (req.isAuthenticated()) {
    Person.find({}, (err, user) => {
      if (err) {
        console.log(err);
      } else {
        Pet.find({}, (err, pets) => {
          if (err) {
            console.log(err);
          } else {
            PetPic.find({}, (err, petPics) => {
              if (err) {
                console.log(err);
              } else {
                Notefication.find({
                  reciver: req.user._id,
                  read: false
                }, (err, notefy) => {
                  Follower.find({}, (err, followers) => {

                    // console.log(user);
                    // console.log(pets);
                    // console.log(petPics);
                    // console.log(notefy);
                    // console.log(followers);

                    res.render("find", {
                      usersDb: user,
                      petDb: pets,
                      petPicsDb: petPics,
                      paramID: req.user._id,
                      flags: notefy,
                      matches: followers
                    });
                  });

                });
              }
            });
          }
        });
      }
    });


  } else {
    res.redirect("/login");
  }
});


app.get("/searchresult/", (req, res) => {

  res.render("matcheshelp", {
    reason: "choose your category from our short list to get matches result ,,, "
  });

});


app.route("/searchresult/:search")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      console.log(req.params.search);

      function search_results() {
        Person.find({}, (err, user) => {
          if (err) {
            console.log(err);
          } else {
            Pet.find({
              category: req.params.search
            }, (err, pets) => {
              if (err) {
                console.log(err);
              } else {
                PetPic.find({}, (err, petPics) => {
                  if (err) {
                    console.log(err);
                  } else {
                    res.render("searchresult", {
                      usersDb: user,
                      petDb: pets,
                      petPicsDb: petPics,
                      paramID: req.user._id
                    });
                  }
                });
              }
            });
          }
        });
      }
      search_results();

    } else {
      res.redirect("/login");
    }
  });

//  make var as a flag to chek how many ads added  by user ..
var length = "";
app.get("/addpets", function(req, res) {
  if (req.isAuthenticated()) {
    const userCheck = req.user;
    Pet.find({
      "userID": userCheck._id
    }, (err, find) => {
      var length = find.length;
      if (length > 7) {
        res.render("matcheshelp", {
          reason: " every user have just 7 free ads in the same time , so u can remove one of your old ads or check our plans for unlimted ads "
        });
        //console.log(length)
      } else {
        res.render("addpets", {});
        //  console.log(length);
      }
    });

  } else {
    res.redirect("/login");
  }
});


app.get("/logout", function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/find');
    }
  });
});


app.get("/user/:dataId", (req, res) => {
  if (req.isAuthenticated()) {
    //  console.log(req.user._id);
    req.params.dataId = req.user._id;

    Person.findOne({
      login_userDB_id: req.user._id
    }, (err, personData) => {
      if (!err) {
        Pet.find({
          userID: personData.login_userDB_id
        }, (err, petsAds) => {
          if (!err) {
            Following.findOne({
              personDb_id: req.user._id
            }, (err, followings) => {
              if (!err) {
                Follower.findOne({
                  personDb_id: " " + req.user._id + " "
                }, (err, followers) => {
                  if (!err) {
                    PetPic.find({
                      user_db_id: personData.login_userDB_id
                    }, (err, petPics) => {
                      if (!err) {
                        //  console.log("followers : "+ followers);
                        //  console.log("followoing : " +followings );
                        //  console.log("person Db :" +personData );
                        //    console.log("pet Data :" +petsAds);
                        //  console.log("pets pics :" + petPics);
                        User.findOne({
                          _id: req.user._id
                        }, (err, theUser) => {
                          if (!err) {
                            res.render("user", {
                              profileData: personData,
                              ads: petsAds,
                              pics: petPics,
                              follower: followers,
                              following: followings,
                              email: theUser.username
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });



  } else {
    res.redirect('/login');
  }
});


app.get("/visit/:profId", (req, res) => {
  if (req.isAuthenticated()) {

    Person.findOne({
      login_userDB_id: req.params.profId
    }, (err, personData) => {
      if (!err) {
        Pet.find({
          userID: personData.login_userDB_id
        }, (err, petsAds) => {
          if (!err) {
            Following.findOne({
              personDb_id: personData.login_userDB_id
            }, (err, followings) => {
              if (!err) {
                Follower.findOne({
                  personDb_id: " " + personData.login_userDB_id + " "
                }, (err, followers) => {
                  if (!err) {
                    PetPic.find({
                      user_db_id: personData.login_userDB_id
                    }, (err, petPics) => {
                      if (!err) {

                        //  console.log("person Db :" +personData );
                        //    console.log("pet Data :" +petsAds);
                        //  console.log("pets pics :" + petPics);
                        User.findOne({
                          _id:personData.login_userDB_id
                        }, (err, theUser) => {
                          if(!err){
                            res.render("visit", {
                              profileData: personData,
                              ads: petsAds,
                              pics: petPics,
                              follower: followers,
                              following: followings,
                              email: theUser.username,
                            });
                          }

                        });

                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

  } else {
    res.redirect("/login")
  }


});


app.route("/editads/:dataId")
  .get((req, res) => {
    if (req.isAuthenticated()) {
    //  console.log(req.user._id);
      req.params.dataId = req.user._id;
      Pet.find({
        userID: req.user._id
      }, (err, petsData) => {
        // console.log(petsData);
        PetPic.find({}, (err, imgs) => {
          res.render("editads", {
            tableData: petsData,
            img: imgs
          });
        });

      });
      async function removeImgFromServer() {
        const path = req.query.path;
        try {
          fs.unlinkSync(path)
          //file removed
        } catch (err) {
          //  console.error(err)
        }
      }
      removeImgFromServer();
    } else {
      res.redirect('/login');
    }
  })
  .post((req, res) => {
    req.params.dataId = req.user._id;
    //console.log( req.user._id);
    //--       ----------------------------  update selected item -------------------------------
    let updateId = req?.body?.updateId?.trim();

    Pet.findByIdAndUpdate(updateId, {
        category: req.body.updatedCategory,
        age: req.body.updatedAge,
        Health: req.body.updatedHealth,
        SpecialMarks: req.body.updatedMarkes,
      },
      function(err, docs) {
        if (err) {

          console.log(err)

        }
      });
    res.redirect("/user/" + req.user._id);

  })
  .delete((req, res) => {
    //------------------------------------  delete selected item
    //if( !mongoose.Types.ObjectId.isValid(id) ) return false;
    Pet.deleteOne({
      _id: req.params.dataId
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("item deleted !");
        res.send("deleted!")
      }
    });
  });


app.route("/editpd/:Id")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      //console.log(req.user._id);
      req.params.Id = req.user._id;
      Person.find({
        login_userDB_id: req.user._id
      }, (err, profileData) => {
        //  console.log(profileData);
        res.render("editpd", {
          tableData: profileData
        });

      });
    } else {
      res.redirect('/login');
    }
  })
  .post((req, res) => {
    req.params.dataId = req.user._id;
    //--       ----------------------------  update selected item -------------------------------
    let updateId = req?.body?.updateId?.trim();

    Person.findByIdAndUpdate(updateId, {
        fullName: req.body.updatedName,
        email: req.body.updatedEmail,
        phone: req.body.updatedNumber,
        dateOfBirth: req.body.updatedAge,

      },
      function(err, docs) {
        if (err) {

          console.log(err)
        } else {
          res.redirect("/user/" + updateId)
        }
      });

  });


app.get("/api", (req, res) => {
  if (req.isAuthenticated()) {
    Person.findOne({
      login_userDB_id: req.user._id
    }).then(profile => {
      if (!profile) {
        res.redirect("/profile/" + req.user._id);
      } else {
        res.redirect("/find");
      }
    }).catch(err => {
      //  console.log(err);
    })
  } else {
    res.redirect("/register");
  }
});


// userChat && reciverRes  >>  for make values not === null to complete render page ..
// chatId used for post to creat Db for unGlobal Var to take its val in find data in table ..
var chat_Id = "";
var userChat = "";
var reciverRes = "";
app.route("/mail/:reciverID")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      //console.log(req.query);
      //console.log(req.params);
      //  console.log(req.query.userdbid);
      Person.findOne({
        _id: req.query.userdbid
      }, (err, found) => {
        //  console.log("reciver : " + found);
        Mail.findOne({
          "inbox.creator.chat_ID": req.params.reciverID + req.user._id
        }, (err, chatDetail) => {
          //  console.log("reciverMail" + chatDetail);
          if (!chatDetail) {
            let chatDetail = userChat;
          }
          Mail.findOne({
            "inbox.creator.chat_ID": req.user._id + req.params.reciverID
          }, (err, otherChat) => {
            //  console.log("others" + otherChat);
            if (!otherChat) {
              let otherChat = reciverRes;
            }
            PetPic.findOne({
              user_db_id: found.login_userDB_id
            }, (err, imgs) => {
              Pet.findOne({
                userID: found.login_userDB_id
              }, (err, docs) => {
                Person.findOne({
                  login_userDB_id: req.user._id
                }, (err, currentUser) => {
                  //  console.log("the Sender : " + currentUser);
                  res.render("mail", {
                    reciverdata: found,
                    reciverAds: docs,
                    reciverImgs: imgs,
                    user: currentUser,
                    userChat: chatDetail,
                    reciverRes: otherChat,
                    reciverId: req.params.reciverID,
                  });

                });
              })

            });

          })


        })

      });


    } else {
      res.redirect("/login");
    }


  })
  .post((req, res) => {
    const notefy = new Notefication({
      eventCreator: req.user._id,
      reciver: req.params.reciverID.trim(),
      type: "message",
      name: req.body.messageContent
    });
    notefy.save();
    console.log(notefy);

    function firestChatMsg() {
      var block = " ";
      var blocReason = "";
      if (blocReason === "badBehavior") {
        var block = 1;
      }
      if (blocReason === "fakeAccount") {
        var block = 2;
      }
      if (blocReason === "others") {
        var block = 0;
      }

      var msgFomat = [];
      var format = ""
      if (typeof(req.body.messageContent) === "string") {
        msgFomat.push("message")
        format = "string"
      } else if (typeof(req.body.messageContent) === "Buffer") {
        msgFomat.push("image")
        format = "Buffer"

      } else {
        msgFomat.push("service-message")
        format = "string"
      }


      let paramId = req.params.reciverID;
      let bodyString = req.body.messageContent;
      let userId = req.user._id;

      const newmail = new Mail({
        inbox: {
          reciver: {
            reciver_UserDb_ID: paramId,
            messageReciver: [bodyString],
            created_at: Date.now(),
            msgFormat: format,
            startingChat: Date.now(),
            online: 2,
            block: block
          },
          creator: {
            sender_User_Id: userId,
            chat_ID: paramId + userId,
            messageCreated: [bodyString],
            created_at: Date.now(),
            msgFormat: format,
            startingChat: Date.now(),
            online: 2,
            block: block
          }
        }
      })
      newmail.save(err => {
        if (err) {
          //    console.log(err);
        } else {
          //  console.log(newmail);
        }
      });
    }
    chat_Id = req.params.reciverID + req.user._id;
    let id = req.user._id;
    //res.redirect("/maildb/" + id);
    Mail.findOne({
      "inbox.creator.chat_ID": chat_Id
    }, (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        if (docs) {

          let newChatMsg = req.body.messageContent;

          Mail.updateOne({
            _id: docs._id
          }, {
            $push: {
              "inbox.reciver.messageReciver": newChatMsg,
              "inbox.creator.messageCreated": newChatMsg,

            }
          }, (err, done) => {
            if (err) {
              console.log(err);
            } else {
              //  console.log(done);
            }
          });
          //console.log(docs.message);
        } else {
          firestChatMsg();
        }
      }
    });

    res.redirect('back');
  })
  .delete((req, res) => {

    Mail.deleteOne({
      _id: req.params.reciverID
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("item deleted !");
        res.send("deleted!")
      }
    });


  })
  .put((req, res) => {
    var updatedVal = "";
    if (req.params.reciverID === "isonline") {
      var updatedVal = 1;
    } else if (req.params.reciverID === "isoffline") {
      var updatedVal = 2;
    }

    Mail.updateOne({
      "inbox.creator.sender_User_Id": req.query.theid
    }, {
      "inbox.creator.online": updatedVal
    }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        res.send(data)
      }
    });
  });



// ids array makes for follower Db saves pepole on arrray we take them and push it to our array to catch them in oerson search
//other user Id  make for take its val and compain it with array of user val to take uniqe chat id to give pure result of chat
var ids = [];
var otherUserId = "";
app.route("/inbox/:userInbox")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      function renderInbox() {
        Person.findOne({
          login_userDB_id: req.user._id
        }, (err, profile) => {
          if (err) {
            console.log(err);
          } else {
            Following.findOne({
              personDb_id: req.user._id
            }, (err, followings) => {
              if (err) {
                console.log(err);
              } else {
                followings.following_users.forEach((entry, index) => {
                  let value = entry.trim();
                  //don't forget that values start with whitespaces
                  ids.push(value)
                });

                Person.find({
                  login_userDB_id: ids
                }, (err, profilesOfOther) => {
                  profilesOfOther.forEach(on => {
                    var otherUserId = on.login_userDB_id;
                  });
                  Mail.find({
                    "inbox.reciver.reciver_UserDb_ID": req.user._id + otherUserId,
                    "inbox.creator.sender_User_Id": ids
                  }, (err, found) => {
                    //  console.log("userProf : " +profile);
                    //  console.log("following : "+followings);
                    //  console.log("inbox : "+found );
                    //  console.log("buddies : "+profilesOfOther );

                    res.render("inbox", {
                      user: profile,
                      inbox: found,
                      buddies: profilesOfOther,
                      following: followings
                    });
                  });
                });
              }
            });
          }
        });
      }
      Following.findOne({
        personDb_id: req.user._id
      }, (err, data) => {
        if (data === null) {
          res.render("matcheshelp", {
            reason: "inbox just open when u chat with some one , and follow him to get him faster with inbox "
          });
        } else {
          renderInbox();
        }
      })

    } else {
      res.redirect("/login");
    }

  })
  .delete((req, res) => {
    //  console.log( req.params.userInbox);
    Mail.deleteOne({
      "inbox.creator.chat_ID": req.params.userInbox,
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("item deleted !");
        res.send("deleted!")
      }
    });
  })
  .patch((req, res) => {
    console.log("param :" + req.params.userInbox);
    let stup = " " + req.params.userInbox + " ";
    Following.updateOne({
      "personDb_id": req.user._id
    }, {
      $pull: {
        following_users: stup,
      }
    }, {
      overwrite: true
    }, (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        deletefromFollwer();
        console.log("following is deleted : " + docs);
      }
    });

    async function deletefromFollwer() {
      Follower.updateOne({
        "personDb_id": " " + req.params.userInbox + " "
      }, {
        $pull: {
          following_users: req.user._id,
        }
      }, {
        overwrite: true
      }, (err, on) => {
        if (err) {
          console.log(err);
        } else {
          console.log(" follower is deleted : " + on);
        }
      });


    }



  });


app.route("/maildb/:useriD")
  .get((req, res) => {

    Mail.find({
      "inbox.creator.sender_User_Id": req.params.useriD
    }, (err, docs) => {
      res.send(docs);
    });
  });


app.get("/spamreq/:chatId", (req, res) => {
  if (req.isAuthenticated()) {

    res.render("spamreq", {
      param: req.params.chatId
    });
  } else {
    res.redirect("/login");
  }
});


app.get("/follow/:followerId", (req, res) => {
  res.send("done");
});


app.route("/notefy/:recivrsdata")
  .patch((req, res) => {
    console.log(req.params.recivrsdata);
    Notefication.updateOne({
      _id: req.params.recivrsdata
    }, {
      read: true
    }, {
      upsert: true
    }, (err, docs) => {
      if (err) {
        console.log(err);
      } else {
        res.send(docs);
      }
    });
  })
  .delete((req, res) => {
    Notefication.deleteOne({
      _id: req.params.recivrsdata,
      reciver: req.user_id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        res.send("notefication deleted")
      }
    });


  });


app.get("/thankful", (req, res) => {
  res.render("thankful")
});


app.get("/termsandconditions", (req, res) => {
  res.render("termsandconditions");

});


app.get("/rateus", (req, res) => {
  res.render("rateus");

});


app.get("/resetpass", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("resetpass");

  } else {
    res.redirect("/login")
  }

});


app.get("/deleteacc", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("deleteacc");
  } else {
    res.redirect("/login")
  }
});



// -----------------------------------------------  ROUTS . POST ----------------------------------------------------


app.post("/verifying", (req, res) => {

  User.findOne({
    userName: req.body.username
  }, (err, user) => {
    if (err) {
      res.send(err);
    } else {
      user.changePassword(req.body.oldpassword,
        req.body.newpassword,
        function(err) {
          if (err) {
            res.send(err);
          } else {
            res.redirect('/resetpass')
          }
        });
    }
  });


});


app.post("/deleteacc", (req, res) => {
  let erseAllData = req.body.erse;
  let deactivateAcc = req.body.delete;

  console.log(erseAllData);
  console.log(deactivateAcc);

  function erseAll() {
    User.deleteOne({
      _id: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("userDb Deleted");
      }
    });

    Person.deleteOne({
      login_userDB_id: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("PersonDb Deleted");
      }
    });

    Pet.deleteOne({
      userID: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("PetDb Deleted");
      }
    });

    PetPic.deleteOne({
      user_db_id: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("petPicsDb Deleted");
      }
    });

    Notefication.deleteOne({
      reciver: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("notefyDB Deleted");
      }
    });

    Mail.deleteOne({
      "inbox.creator.sender_User_Id": req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("MailDB Deleted");
      }
    });

    Follower.deleteOne({
      personDb_id: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("followersDb Deleted");
      }
    });

    Following.deleteOne({
      personDb_id: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("followingDb Deleted");
      }
    });
    res.redirect("/");
  }

  function deleteProfile() {
    Person.deleteOne({
      login_userDB_id: req.user._id
    }, err => {
      if (err) {
        console.log(err);
      } else {
        console.log("PersonDb Deleted");
      }
      res.redirect("/");

    });

  }


  if (erseAllData === "erse") {
    erseAll();
  } else if (deactivateAcc === "delete") {
    deleteProfile();
  }


});


app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {

    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {

        res.redirect("/api");
      });
    }

  });

});


app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/api");
      });
    }


  });

});


profileImg_loc=""
app.post('/profile', (req, res, next) => {
  function creatProfile() {
    req.params.Id = req.user._id;
  //  console.log(req.file);
    const userCheck = req.user;
    var method = "";

    if (userCheck.facebookId != null) {
      var method = 2;
    } else if (userCheck.googleId != null) {
      var method = 1;
    } else {
      var method = 0;
    }
    const newPerson = new Person({
      login_userDB_id: userCheck._id,
      dateOfBirth: req.body.age,
      fullName: req.body.userName,
      email: req.body.userEmail,
      phone: req.body.userNumber,
      numberValidation: req.body.numberValidation,
      acceptingPolicy: "YES",
      signUpMethod: method,
      accountStatus: 2,
      governorate_name: req.body.userGovurnement,
      city_name: req.body.userCity,
      ImageLink: profileImg_loc,
      Photo_URL: req.file.path, //{/uploades/soertelbaniadamelgamedneek.png}
      facebookID: userCheck.facebookId,
      GoogleID: userCheck.googleId,

    });
    newPerson.save();
    res.redirect("/find");

  }
  if (req.body.userName.length > 20) {
    res.render("matcheshelp", {
      reason: " your Name must be 10 letter or less , all on Letters "
    });
  } else if (req.body.age > 100) {
    res.render("matcheshelp", {
      reason: " your age may be less than  100   .. ,, "
    });
  } else if (req.body.userNumber.toString().length > 12) {
    res.render("matcheshelp", {
      reason: "Number is not required but if u will add it , it must be 12 number  ,, "
    });
  } else if (req.body.userCity === null) {
    res.render("matcheshelp", {
      reason: " chooseing city helps you to get perfect matches  ,,"
    });
  } else if (req.file) {
    creatProfile();
  } else {
    res.render("matcheshelp", {
      reason: " you have to upload profile photo for u to creat Matches Profile  ,, "
    });
  }

});


app.post('/addpets', (req, res, next) => {
  function creatAds() {
    const userCheck = req.user;
    var obj = {
      name: req.body.petsCategory,
      user_db_id: userCheck._id,
      imageLink: req.file.path,
      img: {
        data: toString(fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename))),
      }
    };
    PetPic.find({
      imageLink: req.file.path
    }, (err, on) => {
      if (err) {
        console.log(err);
      } else {
        if (on.length > 0) {
          res.redirect("/addpets")
        } else {
          PetPic.create(obj, (err, found) => {
            if (err) {
              console.log(err);
            } else {
              found.save();
              const newPet = new Pet({
                petPic_Link: found.imageLink,
                petPic_id: found._id,
                userID: userCheck._id,
                category: req.body.petsCategory,
                age: req.body.age,
                Health: req.body.healthStatus,
                SpecialMarks: req.body.specialMarks

              });
              newPet.save();
              res.redirect("/find");
            }
          });
        }
      }
    });
  }
//  console.log(req.body);
  if (req.body.petsCategory.length > 30) {
    res.render("matcheshelp", {
      reason: "choose one of our category to have best experince in matches search engine ,,,  "
    });
  } else if (req.body.age > 80) {
    res.render("matcheshelp", {
      reason: "put your Pet Age under 80  ,,,  "
    });
  } else if (req.body.specialMarks.length > 100) {
    res.render("matcheshelp", {
      reason: " just you can write 100 Letters for pets markes   ,,   "
    });
  } else if (req.body.healthStatus.length > 100) {
    res.render("matcheshelp", {
      reason: " just you can write 100 Letters for Health   ,,   "
    });
  } else if (req.file) {
    creatAds();
  } else {
    res.render("matcheshelp", {
      reason: " you have to upload your Pet Picture to catch eye for  Matches   ,, "
    });
  }

});


app.post("/spamreq/:chatId", (req, res) => {
  if (req.isAuthenticated()) {

    let spamReason = req.body.spamReason;
    let spamExplain = req.body.spamExplain;

    Mail.findOne({
      _id: req.params.chatId
    }, (err, chatDetail) => {
      let thePerson_weGo_To_Spam = chatDetail.inbox.reciver.reciver_UserDb_ID;
      let theChat = chatDetail.inbox.reciver.messageReciver;
      console.log(thePerson_weGo_To_Spam);

      Person.findOne({
        login_userDB_id: thePerson_weGo_To_Spam
      }, (err, person) => {
        let spamerName = person.fullName;
        let spamerMail = person.email

        Pet.find({
          userID: thePerson_weGo_To_Spam
        }, (err, ads) => {
          let adsNumber = ads.length;
          //console.log("rebort : " + "name : "+ spamerName + "email : "+ spamerMail +" adsNumber : " +adsNumber + " spamReason" + spamReason
          //+ "chatDetail :  " + theChat +  " chat-Id : " + req.params.chatId  + " userDB_ID : " +  thePerson_weGo_To_Spam
          //  + "spamExplain : "+ spamExplain  );
        });
      });
    });

    res.redirect("/user/" + req.user._id)
  } else {
    res.redirect("/login");
  }
});


app.post("/follow/:followerId", (req, res) => {
  const notefy = new Notefication({
    eventCreator: req.body.follower_person_DbId,
    reciver: req.body.Person_followe_run.trim(),
    type: "follow",
    name: req.body.noteficationName
  });
  notefy.save();
  // console.log(notefy);

  function followUser() {
    let followersNumber = [];
    followersNumber.push(req.body.follower_person_DbId);

    const newFollower = new Follower({
      personDb_id: req.body.Person_followe_run,
      followers_user: followersNumber,
    });
    newFollower.save();
    //  console.log("new follower :" + newFollower);
  }

  function following() {
    let following = [];
    following.push(req.body.Person_followe_run);

    const newFollowing = new Following({
      personDb_id: req.body.follower_person_DbId,
      following_users: following,
    });
    newFollowing.save();
    //  console.log("new follower :" + newFollower);
  }

  Follower.findOne({
    personDb_id: req.body.Person_followe_run
  }, (err, isFollow) => {
    if (err) {
      console.log(err);
    } else {
      if (isFollow) {
        var checkFollow = (isFollow.followers_user.indexOf(req.body.follower_person_DbId) > -1);
        if (checkFollow === true) {
          console.log("alredy Follower !!");
        } else {

          Follower.updateOne({
            _id: isFollow._id
          }, {
            $push: {
              followers_user: req.body.follower_person_DbId,
            }
          }, (err, on) => {
            if (err) {
              console.log(err);
            } else {
              console.log("okki");
            }
          });
        }
      } else {
        followUser();
      }
    }

  });



  Following.findOne({
    personDb_id: req.body.follower_person_DbId
  }, (err, isFollow) => {
    if (err) {
      console.log(err);
    } else {
      if (isFollow) {
        var checkFollow = (isFollow.following_users.indexOf(req.body.Person_followe_run) > -1);
        if (checkFollow === true) {
          console.log("alredy Follower !!");
        } else {

          Following.updateOne({
            _id: isFollow._id
          }, {
            $push: {
              following_users: req.body.Person_followe_run,
            }
          }, (err, on) => {
            if (err) {
              console.log(err);
            } else {
              console.log("okki");
            }
          });
        }
      } else {
        following();
      }
    }

  });


  res.redirect("back");

});


// -------------------------------------  SERVER listen -----------------------------------------------------
port = process.env.PORT||3000;
app.listen(port, function() {
  console.log("server runinng in port 3000");
});
