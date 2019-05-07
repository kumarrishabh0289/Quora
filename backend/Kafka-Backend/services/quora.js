const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
const Profile = require('../models/profile');
var kafka = require('../kafka/client');
const fs = require('fs');
const Topicfollower = require('../models/topicfollower');
const Topic = require('../models/topic');
const Question = require('../models/question');
const Answers = require('../models/answers');
const Comments = require('../models/comments');
const Votes = require('../models/votes');
const Bookmarks = require('../models/bookmarks');
const Notifications = require('../models/notifications');
const Followers = require('../models/follower');
var multer = require('multer');
const path = require("path");
const Messages = require('../models/messages');

mongoose.connect('mongodb+srv://root:' +
    process.env.MONGO_PASSWORD +
    '@cluster0-kgps1.mongodb.net/quora?retryWrites=true',
    {
        useNewUrlParser: true
    }
);

const storage = multer.diskStorage({
    destination: "../frontend/public/uploads/topic",
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 999999999999999999999999 },
}).single("myImage");

mongoose.set('useCreateIndex', true)

function handle_request(message, callback) {

    var req = message;

    switch (message.type) {
        case 'test':
            try {
                console.log("In the test", message.type);
                callback(null, { result: "Success" });
            }
            catch (err) {
                console.log(err);
            }
            break;

        case 'topics/get':
            try {
                Topic.find()
                    .exec()
                    .then(docs => {
                        console.log(docs);
                        fs.appendFile('logs.txt', 'Status 200, Topics Returned  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(null, docs);
                    })
                    .catch(err => {
                        callback(null, err);

                    })
            }
            catch (err) {
                console.log(err);
            }
            break;

        case 'topics/post':
            try {
                upload(req, res, (err) => {
                    const param = req.body.param;
                    var picName = "";
                    if (req.file == null || req.file.originalname == null || req.file.originalname == "") {
                        picName = "default.jpg"; //if no pic was uploaded display default
                    }
                    else {
                        var picName = req.file.originalname;
                        var filepath = req.file;
                        var filepath = filepath.filename;
                    }
                    var data = { topic: param, picture: picName };
                    var query = { topic: param },
                        options = { upsert: true, new: true, setDefaultsOnInsert: true };

                    //console.log("Request file ---", JSON.stringify(req.file));  //Here you get file.

                    // //first you wanna check if topic exists, then create else update
                    Topic.findOneAndUpdate(query, { $set: data }, options, function (error, result) {
                        console.log("resiult", error)
                        console.log("inside");
                        fs.appendFile('logs.txt', 'Status 200, Topics Created  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(null, { result: "Success" });

                    });

                }); //upload end
            }
            catch (err) {
                callback(null, { result: err });
            }
            break;

        case 'topics/follow':
            try {
                const param = req.body.topic;
                const follower = req.body.follower;
                var object = new Topicfollower({ _id: new mongoose.Types.ObjectId(), topic: param, follower: follower });
                object
                    .save()
                    .then(result => {
                        console.log(result);
                    }).catch(err => console.log(err));
                fs.appendFile('logs.txt', 'Status 200, Topics Followed  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, { result: "Success" });

            }
            catch (err) {
                callback(null, { result: err });
            }
            break;

        case 'topics/isfollowed':
            try {
                var topic = req.query.topic;
                var follower = req.query.follower;
                Topicfollower.find({ topic: topic, follower: follower })
                    .exec()
                    .then(docs => {

                        callback(null, docs);
                    })
                    .catch(err => {
                        callback(null, { result: err });

                    })
            }
            catch (err) {
                console.log(err);
            }
            break;

        case 'answers/get':
            try {
                const id = req.query._id;
                Answers.find({ questionID: id })
                    .exec()
                    .then(docs => {
                        console.log(docs);
                        fs.appendFile('logs.txt', 'Status 200 - GET, All Answers Returned  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(null, docs);

                    }).catch(err => {
                        console.log(err);
                        fs.appendFile('logs.txt', 'Status 500 - GET, Error: Answers could not be Returned  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(err, null);
                    });
            }
		
		case answers / one:
            try {
                const id = req.query._id;
                console.log(id);
                Answers.findOne({ questionID: id })
                    .exec()
                    .then(docs => {
                        if (docs) {
                            console.log(docs);
                            fs.appendFile('logs.txt', 'Status 200 - GET/one, One Answer Returned  ' + Date.now() + '\n', function (err) {
                                if (err) throw err;
                                console.log('Updated!');
                            });
                            callback(null, docs);
                        }
                        else {
                            fs.appendFile('logs.txt', 'Status 200 - GET/one,  ' + Date.now() + '\n', function (err) {
                                if (err) throw err;
                                console.log('Updated!');
                            });
                            callback(null, ' ');
                        }
                        // res.status(200).json(docs);
                    }).catch(err => {
                        console.log(err);
                        fs.appendFile('logs.txt', 'Status 500 - GET/one, Answer Not Returned  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(err, null);
                    });
            }
		
		case answers / post:
            try {
                var question = "Question";
                Questions.find({ _id: req.body._id }).then(result => {
                    console.log("res", result)
                    question = result[0].question;
                    upload(req, res, (err) => {
                        console.log("Request ---", req.body);

                        if (!req.file) {
                            filepath = ''
                        }
                        else {
                            console.log("Request file ---", JSON.stringify(req.file));  //Here you get file.
                            var filepath = req.file;
                            var filepath = filepath.filename;
                        }
                        const answer = new Answers({
                            _id: new mongoose.Types.ObjectId(),
                            questionID: req.body._id,
                            owner: req.body.email,
                            answer: req.body.answer,
                            isAnonymous: req.body.anonymousStatus,
                            isCommentable: req.body.commentable,
                            isVotable: req.body.votable,
                            upVote: 0,
                            downVote: 0,
                            views: 0,
                            fname: req.body.fname,
                            lname: req.body.lname,
                            image: req.body.image,
                            question: question

                        });


                        if (req.body.answer) {
                            Answers.find({ owner: req.body.email, questionID: req.body._id }).exec().then(result => {
                                if (result.length > 0) {
                                    fs.appendFile('logs.txt', 'Status 200 - POST, Already Answered  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                                        if (err) throw err;
                                        console.log('Updated!');
                                    });
                                    callback(null, "Already Answered");
                                }
                                else {
                                    answer.save()
                                        .then(result => {
                                            console.log(result);

                                            Notifications.update({ questionID: req.body._id }, { $set: { answer: req.body.answer, view: true } }, { multi: true }).then(resultNew => {
                                                console.log(resultNew);
                                                fs.appendFile('logs.txt', 'Status 200 - POST, Successfully Answered  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                                                    if (err) throw err;
                                                    console.log('Updated!');
                                                });
                                                callback(null, { message: "Successfully Answered" });
                                            })


                                        }).catch(err => {
                                            fs.appendFile('logs.txt', 'Status 200 - POST, Unable to add answer  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                                                if (err) throw err;
                                                console.log('Updated!');
                                            });
                                            callback(null, { message: "Unable to add answer" });
                                        });
                                }
                            })
                        }
                    });
                }
		
		case answers / edit:
            try {
                console.log('ID: ', req.body._id);
                console.log('EMAIL', req.body.email);
                console.log('ANSWER ', req.body.answer);
                console.log('ANONYMITY ', req.body.anonymousStatus);
                Answers.update({ _id: req.body._id, owner: req.body.email }, { $set: { answer: req.body.answer, isAnonymous: req.body.anonymousStatus, isCommentable: req.body.commentable, isVotable: req.body.votable } })
                    .exec()
                    .then(result => {
                        console.log(result);
                        fs.appendFile('logs.txt', 'Status 200 - POST, Successfully Edited  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(null, "Successfully Edited");
                    }).catch(err => {
                        console.log(err);
                        fs.appendFile('logs.txt', 'Status 200 - POST/edit, Could not be Edited  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(null, "Could noyt be Edited");
                    });
            }
		
		
		case answers / upvote:
            try {
                Votes.find({ answerID: req.body._id, owner: req.body.email }).then(result => {
                    if (result.length > 0) {
                        fs.appendFile('logs.txt', 'Status 200 - POST/upvote, You are not allowed to vote more than once  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        res.status(200).json({
                            flag: false,
                            message: "You are not allowed to vote more than once"
                        })
                    }
                    else {
                        Answers.update({ _id: req.body._id }, { $inc: { upVote: 1, views: 1 } })
                            .exec()
                            .then(result => {
                                console.log(result);
                                const vote = new Votes({
                                    _id: new mongoose.Types.ObjectId(),
                                    answerID: req.body._id,
                                    owner: req.body.email,
                                    upVote: true,
                                    downVote: false
                                });

                                vote.save().then(result => {
                                    console.log(result);
                                    fs.appendFile('logs.txt', 'Status 200 - POST/upvote, Flag True, Successfully Upvoted  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                                        if (err) throw err;
                                        console.log('Updated!');
                                    });
                                    callback(null, "Successfully Upvoted");
                                }).catch(err => {
                                    console.log(err);
                                })
                            }).catch(err => {
                                console.log(err);
                            });
                    }
                }).catch(err => {
                    console.log(err);
                })

            }
		
		case answers / downvote:
            try {
                Votes.find({ answerID: req.body._id, owner: req.body.email }).then(result => {
                    if (result.length > 0) {
                        fs.appendFile('logs.txt', 'Status 200 - POST/downvote, Flag False, You are not allowed to vote more than once  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        res.status(200).json({
                            flag: false,
                            message: "You are not allowed to vote more than once"
                        })
                    }
                    else {
                        Answers.update({ _id: req.body._id }, { $inc: { upVote: 1, views: 1 } })
                            .exec()
                            .then(result => {
                                console.log(result);
                                const vote = new Votes({
                                    _id: new mongoose.Types.ObjectId(),
                                    answerID: req.body._id,
                                    owner: req.body.email,
                                    upVote: false,
                                    downVote: true
                                });

                                vote.save().then(result => {
                                    console.log(result);
                                    fs.appendFile('logs.txt', 'Status 200 - POST/downvote, Flag True, Successfully Downvoted  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                                        if (err) throw err;
                                        console.log('Updated!');
                                    });
                                    callback(null, "Successfully Downvoted");
                                }).catch(err => {
                                    console.log(err);
                                })
                            }).catch(err => {
                                console.log(err);
                            });


                    }
                })
            }

    }
	
                
    case answers / comment / post:
    try {
        Answers.find({ _id: req.body._id }).exec().then(result => {
            if (result.length > 0) {
                const comment = new Comments({
                    _id: new mongoose.Types.ObjectId(),
                    answerID: req.body._id,
                    comment: req.body.comment
                });

                if (req.body.comment) {
                    comment.save().then(result => {
                        console.log(result);
                        fs.appendFile('logs.txt', 'Status 200 - POST/comment, Flag True, Successfully Commented  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(null, "Successfully Commented");
                    }).catch(err => {
                        console.log(err);
                        fs.appendFile('logs.txt', 'Status 204 - POST/comment, Flag True, Comment Unsuccessful  ' + Date.now() + '\n', function (err) {
                            if (err) throw err;
                            console.log('Updated!');
                        });
                        callback(null, "Comment Unsuccessful");
                    })
                }
            }
        })
    }

   case answers / comment / get:
    try {
        const id = req.query._id;
        console.log('COMMENTS', id);
        Comments.find({ answerID: id }).exec().then(docs => {
            console.log.bind('COMMENTS', docs);
            if (docs.length > 0) {
                fs.appendFile('logs.txt', 'Status 200 - GET/comment, All Comments Returned  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, docs);
            }
            else {
                fs.appendFile('logs.txt', 'Status 200 - GET/comment, No Comments for this answer  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, "No Comments for this answer");
            }
        }).catch(err => {
            fs.appendFile('logs.txt', 'Status 200 - GET/comment, Error  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(err, null);
        });
    }
   
   case answers / useranswer:
    try {
        Answers.find({ owner: req.query.email }).exec().then(result => {
            if (result.length > 0) {
                fs.appendFile('logs.txt', 'Status 200 - GET/useranswer, User Answer Returned  ' + req.query.email + '  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, result);
            }
            else {
                fs.appendFile('logs.txt', 'Status 204 - GET/useranswer, No Answers Found  ' + req.query.email + '  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, "No Answers Found");
            }
        }).catch(err => {
            console.log(err);
            fs.appendFile('logs.txt', 'Status 200 - GET/useranswer, Error  ' + req.query.email + '  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(err, null);
        });
    }
   
   case answers / question:
    try {
        Questions.find({ _id: req.query._id }).exec().then(docs => {
            if (docs.length > 0) {
                console.log('MY QUESTION ', docs);
                fs.appendFile('logs.txt', 'Status 200 - GET/question, Question Returned  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, docs);
            }
            else {
                fs.appendFile('logs.txt', 'Status 200 - GET/question, No Questions Found  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, "No Questions Found");
            }
        }).catch(err => {
            console.log(err);
            fs.appendFile('logs.txt', 'Status 200 - GET/question, Error  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(err, null);
        })
    }
   
   case answers / bookmark:
    try {
        var answerID = req.body._id;
        var questionID = req.body.questionID;
        var answer = req.body.answer;
        var email = req.body.email;
        var question = req.body.question;
        var questionOwner = req.body.questionOwner;
        Bookmarks.find({ answerID: answerID, owner: email }).then(result => {
            if (result.length > 0) {
                fs.appendFile('logs.txt', 'Status 200 - POST/bookmark, Removed from Bookmarks  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                Bookmarks.remove({ answerID: answerID, owner: email }).then(resultBook => {
                    callback(null, resultBook);
                });
            }
            else {
                const bookmark = new Bookmarks({
                    _id: new mongoose.Types.ObjectId(),
                    questionID: questionID,
                    answerID: answerID,
                    owner: email,
                    answer: answer,
                    question: question,
                    questionOwner: questionOwner
                });

                bookmark.save().then(result => {
                    console.log(result);
                    fs.appendFile('logs.txt', 'Status 200 - POST/bookmark, Bookmark saved  ' + req.body.email + '  ' + Date.now() + '\n', function (err) {
                        if (err) throw err;
                        console.log('Updated!');
                    });
                    callback(null, true);
                });
            }
        })
    }
   
   case answers / bookmark:
    try {
        var email = req.query.email;
        Bookmarks.find({ owner: email }).then(result => {
            if (result.length > 0) {
                fs.appendFile('logs.txt', 'Status 200 - GET/bookmark, All Bookmarks returned  ' + req.query.email + '  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, result);
            }
            else {
                fs.appendFile('logs.txt', 'Status 200 - GET/bookmark, No Bookmarked answers found  ' + req.query.email + '  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, "No Bookmarked answers found");
            }
        })
    }
   
   case answers / view:
    try {
        var questionID = req.body.questionID;
        Answers.update({ questionID: questionID }, { $inc: { views: 1 } }, { multi: true }).then(resultA => {
            console.log(resultA);
            Questions.update({ _id: questionID }, { $inc: { views: 1 } }, { multi: true }).then(resultQ => {
                console.log(resultQ);
                fs.appendFile('logs.txt', 'Status 200 - POST/views, View Incremented  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, "Views Incremented");
            })
        });
    }
   
   case answers / answered:
    try {
        var owner = req.query.owner;
        var query = { owner: owner };
        var sort = req.query.sort == null || req.query.sort == "" ? -1 : req.query.sort; //for your content
        var yearFilter = req.query.year == null || req.query.year == "" ? "" : req.query.year;//for your content

        Answers.find(query)
            .sort({ posted: sort })
            .exec()
            .then(docs => {

                if (yearFilter != "") {

                    var original_docs = docs;
                    docs = [];
                    for (var i in original_docs) {
                        if (yearFilter == original_docs[i].posted.getFullYear()) { docs.push(original_docs[i]); }
                    }

                }
                fs.appendFile('logs.txt', 'Status 200 - POST/answered, Returning Sorted  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, docs);
            })
            .catch(err => {
                console.log(err);
                callback(err, null);
            })
    }
   
   case answers / notify:
    try {
        var email = req.query.email;
        Notifications.find({ follower: email, seen: false, view: true }).exec().then(result => {
            fs.appendFile('logs.txt', 'Status 200 - GET/notify, Return Notifications  ' + email + '  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(null, result);

        })
    }
   
   case answers / notifycount:
    try {
        var email = req.query.email;
        Notifications.find({ follower: email, seen: false, view: true }).count()
            .exec().then(result => {
                fs.appendFile('logs.txt', 'Status 200 - POST/notifycount, user:' + email + ',  Return Notifications  ' + Date.now() + '\n', function (err) {
                    if (err) throw err;
                    console.log('Updated!');
                });
                callback(null, result);

            })
    }
   
   case answers / notify / post:
    try {
        var email = req.body.email;
        Notifications.update({ follower: email, view: true }, { $set: { seen: true } }, { multi: true }).exec().then(result => {
            console.log(result);
            fs.appendFile('logs.txt', 'Status 200 - POST/notify, Removed from notification  ' + email + '  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(null, "Removed from notification");

        })
    }
   
   case messages / post:
    try {
        const { to, from, content, date } = req.body;
        const data = new Messages({
            _id: new mongoose.Types.ObjectId(),
            to: to,
            from: from,
            content: content,
            date: new Date(),
        })
        data.save().then(result => {
            console.log(result);
            fs.appendFile('logs.txt', 'Status 200 - POST, Message sent succesfully  ' + from + '  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(null, "Message sent succesfully");
        }).catch(err => {
            console.log(err);
            fs.appendFile('logs.txt', 'Status 500 - POST, Error Sending Messages  ' + from + '  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(err, null);
        })
    }
   
   case messages / get:
    try {
        const { email } = req.query;
        var query = { to: email };

        Messages.find(query).exec().then(result => {
            console.log(result);
            fs.appendFile('logs.txt', 'Status 200 - GET, Sending Received Messages  ' + email + '  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(null, result);
        }).catch(err => console.log(err));
    }
   
   case messages / sent:
    try {
        const { email } = req.query;
        var query = { from: email };

        Messages.find(query).exec().then(result => {
            console.log(result);
            fs.appendFile('logs.txt', 'Status 200 - GET/sent, Sending Sent Messages  ' + email + '  ' + Date.now() + '\n', function (err) {
                if (err) throw err;
                console.log('Updated!');
            });
            callback(null, result);
        }).catch(err => console.log(err));
    }
}

exports.handle_request = handle_request;