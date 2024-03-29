var mongoose = require("mongoose");
var user = mongoose.model("user");
var capsule = mongoose.model("capsule");
var image = mongoose.model("img");
var video = mongoose.model("video");
var fs = require('fs');
var del = require("del");
var nodemailer = require("nodemailer");

const createCapsule = function(req, res) {
    if (!req.body.recipient0){
        //no recipients listed
        req.flash("error_msg", "Please list at least one recipient");
        return res.redirect("/create");
    }
    if (req.body.recipient0) {

        var recipientList = [];
        //check recipient0 here

        recipientList.push(req.body.recipient0);
        var recipientCount = 1;
        while (true){
            var name = "recipient" + recipientCount;
            if (!req.body[name]){
                break
            }
            if(!req.checkBody(req.body[name], 'Email is not valid').isEmail()){
                req.flash("error_msg", "A recipient you listed does not have a valid email");
                return res.redirect("/create");
            }
            recipientList.push(req.body[name]);
            recipientCount ++;
        }

        var newCapsule = new capsule ({
            "dateCreated": Date.now(),
            "released": false,
            "senderFirstName": req.user.firstName,
            "senderLastName" : req.user.lastName,
            "recipients":recipientList
        });

        if (req.body.note){
            newCapsule.note = req.body.note;
        }
        else{
            req.flash("error_msg", "Please leave a note");
            return res.redirect("/create");
        }
        if (req.files.imageInput){
            var images = [];
            if (!(req.files.imageInput instanceof Array) ){
                var input = [req.files.imageInput];
            }
            else{
                var input = req.files.imageInput;
            }
            input.forEach(function(element){
                    var newImage  = new image ({
                        data: fs.readFileSync(element.file),
                        contentType: element.mimetype
                    });
                    images.push(newImage._id);
                    newImage.save();
                    del("uploads/" + element.uuid + "/**");

                }
            );
            newCapsule.img = images;
        }
        if (req.files.videoInput){
            var videos = [];
            if (!(req.files.videoInput instanceof Array) ){
                var input = [req.files.videoInput];
            }
            else{
                var input = req.files.videoInput;
            }
            input.forEach(function(element){
                    var newVideo  = new video ({
                        data: fs.readFileSync(element.file),
                        contentType: element.mimetype
                    });
                    videos.push(newVideo._id);
                    newVideo.save();
                    del("uploads/" + element.uuid + "/**");

                }
            );
            newCapsule.video = videos;
        }
        var newCapsulesSent = {};
        newCapsulesSent.capsulesSent = req.user.capsulesSent;
        newCapsulesSent.capsulesSent.push(newCapsule);
        user.findByIdAndUpdate(req.user._id, {$set: newCapsulesSent}, function(err, doc) {
            if(err) {
                console.log(err);
            }
            else {
                console.log("about to redirect");
                 return res.redirect("/");
            }
        });
    }


};
const releaseCapsule = function(req, res) {
    if (req.body.deceased && req.body.datePassing) {
        //req.body.deceased is of the form <firstName>,<userName>
        //split the string by the ,
        var username = req.body.deceased;
        //find recently deceased user by username
        user.findOne({username: username}, function (err, recentlyDeceased) {
            if(recentlyDeceased) {
                console.log("recently deceased found in db");
                if (err) {
                    return next(err);
                }
                // mark confirm1 as true if user is the first nominee of the deceased user

                if (recentlyDeceased.nominee1email == req.user.username) {
                    console.log("nominee1 confirmed");
                    recentlyDeceased.confirm1 = true;
                }
                else if (recentlyDeceased.nominee2email == req.user.username) {
                    console.log("nominee1 confirmed");
                    recentlyDeceased.confirm2 = true;
                }
                /* =================
                * CODE FOR RELEASING CAPSULES GOES HERE
                 */
                if (recentlyDeceased.confirm1 && recentlyDeceased.confirm2) {
                    console.log("both nominees have confirmed");

                    //iterate through each capsule the recently deceased user created
                    recentlyDeceased.capsulesSent.forEach(function (sentCapsule) {
                        //iterate through all the recipients for the current sentCapsule
                        sentCapsule.recipients.forEach(function (recipient) {
                            //push the capsule object to the array of receivedCapsules for the recipient
                            user.findOne({username: recipient}, function (err, capsuleRecipient) {
                                //if capsuleREcipient is null
                                if (!capsuleRecipient) {
                                    console.log('case1');
                                    //email is sent to non-users
                                    var transporter = nodemailer.createTransport({
                                        service: 'gmail',
                                        secure: false,
                                        port: 300,
                                        auth: {
                                            user: 'onelasttime.system@gmail.com',
                                            pass: 'iloveweb123'

                                        },
                                        tls: {
                                            rejectUnauthorized: false
                                        }
                                    });
                                    var mailOptions = {
                                        from: req.user.firstName,
                                        to: recipient, // list of receivers
                                        subject: 'One Last Time nominee for ' + req.user.firstName, // Subject line
                                        html: req.user.firstName + ' has left you a message. To view this message, please create an account using this email address at http://radiant-mountain-46628.herokuapp.com/.' // html body
                                    };
                                    transporter.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        console.log('Message sent: %s', info.messageId);
                                        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));


                                    });
                                }
                                else{
                                    console.log('case2');
                                    var transporter = nodemailer.createTransport({
                                        service: 'gmail',
                                        secure: false,
                                        port: 300,
                                        auth: {
                                            user: 'onelasttime.system@gmail.com',
                                            pass: 'iloveweb123'

                                        },
                                        tls: {
                                            rejectUnauthorized: false
                                        }
                                    });
                                    var mailOptions = {
                                        from: req.user.firstName,
                                        to: recipient, // list of receivers
                                        subject: 'One Last Time nominee for ' + req.user.firstName, // Subject line
                                        html: req.user.firstName + ' has left you a message. To view this message, please login using this email.' // html body
                                    };
                                    transporter.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            return console.log(error);
                                        }
                             
                                        console.log('Message sent: %s', info.messageId);
                                        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));


                                    });
                                    capsuleRecipient.capsulesReceived.push(sentCapsule);
                                    capsuleRecipient.save({suppressWarning: true}, function (capsuleRecipienterr, event) {
                                        if (capsuleRecipienterr) {
                                            return next(capsuleRecipienterr);
                                        }

                                    });
                                }
                            });


                        });
                        sentCapsule.released = true;
                        // save all changes to sentCapsule document
                        sentCapsule.save({suppressWarning: true}, function (sentCapsuleerr, event) {
                            if (sentCapsuleerr) {
                                return next(sentCapsuleerr);
                            }
                        });
                        recentlyDeceased.save(function (recentlyDeceasederr, event) {
                            if (recentlyDeceasederr) {
                                return next(recentlyDeceasederr);
                            }
                        });
                    });
                }
                //save all the changes to recentlyDeceased
                recentlyDeceased.save(function (saveerr, event) {
                    if (saveerr) {
                        return next(saveerr);
                    }
                    console.log("recently deceased changes have been saved");
                    return res.redirect("/");
                });
            }

            console.log("recently deceased not found");
            //return res.redirect("/");
        });
    }



};
const updateAccount = function(req, res) {
    //sending email to non-user


    if((req.user.nominee1email != req.body.nominee1email) && (req.body.nominee1email)){
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            secure:false,
            port:300,
            auth: {
                user: 'onelasttime.system@gmail.com',
                pass: 'iloveweb123'

            },
            tls:{
                rejectUnauthorized:false
            }
        });
        var mailOptions = {
            from: req.user.firstName,
            to: req.body.nominee1email, // list of receivers
            subject: 'One Last Time nominee for '+req.user.firstName, // Subject line

            html:req.user.firstName+' has made you their security nominee! Please create an account using this email address, so that you can release their capsule when they pass away.' // html body
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                req.flash("error_msg", "Unable to update profile");
                return res.redirect("/account");
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));


        });

    }

    if((req.user.nominee2email != req.body.nominee2email)&& (req.body.nominee2email)){
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            secure:false,
            port:300,
            auth: {
                user: 'onelasttime.system@gmail.com',
                pass: 'iloveweb123'

            },
            tls:{
                rejectUnauthorized:false
            }
        });
        var mailOptions = {
            from: req.user.firstName,
            to: req.body.nominee2email, // list of receivers
            subject: 'One Last Time nominee for'+req.user.firstName, // Subject line
            html: req.user.firstName+' has made you their security nominee! Please create an account using this email address, so that you can release their capsule when they pass away.'
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                req.flash("error_msg", "Unable to update profile");
                return res.redirect("/account");
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));


        });

    }

    console.log("updating account");
    var newData = {};
    if (req.body.firstName){
        newData.firstName = req.body.firstName;
    }
    if (req.body.lastName){
        newData.lastName = req.body.lastName;
    }
    if (req.body.dateOfBirthF) {
        newData.dateOfBirthF = req.body.dateOfBirthF;
    }

    //find nominee and set user as dependent
    if (req.body.nominee1email) {
        newData.nominee1email = req.body.nominee1email;
        user.findOne({username: req.body.nominee1email}, function(err, foundUser) {
            if (!foundUser) {
                console.log("couldnt find user");
                req.flash("error_msg", "Unable to update profile");
                return res.redirect("/account");
            }
            if (foundUser) {
                console.log("creating dependent");
                foundUser.dependents.push(req.user.username);
                foundUser.save(function (err, event) {
                    if (err) {
                        req.flash("error_msg", "Unable to update profile");
                        return res.redirect("/account");
                    }
                });
            }
        });

    }
    //find nominee and set user as dependent
    if (req.body.nominee2email) {
        newData.nominee2email = req.body.nominee2email;
        user.findOne({username: req.body.nominee2email}, function(err, foundUser) {
            if (!foundUser) {
                console.log("couldnt find user");
                req.flash("error_msg", "Unable to update profile");
                return res.redirect("/account");
            }
            if (foundUser) {
                console.log("creating dependent");
                foundUser.dependents.push(req.user.username);
                foundUser.save(function (err, event) {
                    if (err) {
                        req.flash("error_msg", "Unable to update profile");
                        return res.redirect("/account");
                    }
                });
            }
        });
    }


    if (req.files.profilePic) {
        console.log("profile pic received");
        console.log(req.files.profilePic);
        var newImage  = new image ({
            data: fs.readFileSync(req.files.profilePic.file),
            contentType: req.files.profilePic.mimetype
        });
        console.log("profile pic path:");
        console.log(req.files.profilePic.file);
        newImage.save(function(err,event) {
            if (err) {
                req.flash("error_msg", "Unable to update profile");
                return res.redirect("/account");
            }
        });
        newData.profilePic = newImage._id;
        console.log("newImage id:");
        console.log(newImage._id);
        del("uploads\\" + req.files.profilePic.uuid + "\\**");
    }
    console.log(req.user);
    /*find the user with matching id and username and updates its attributes based on set*/
    user.findOneAndUpdate({_id: req.user._id}, {$set: newData}, function(err, doc) {
        if(err) {
            req.flash("error_msg", "Unable to update profile");
            return res.redirect("/account");
        }
        else {
            console.log(doc);
            req.flash("success_msg", "Updated profile successfully");
            return res.redirect("/account");
        }
    });




};

const registerUser = function (req, res) {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var username = req.body.username;
    var password = req.body.password;
    var dateOfBirthF = req.body.dateOfBirthF;

    // Validation
    req.checkBody('firstName', 'First Name is required').notEmpty();
    req.checkBody('lastName', 'Last Name is required').notEmpty();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
    req.checkBody('dateOfBirthF', 'Date of birth is required').notEmpty();

    var errors = req.validationErrors();

    if(req.validationErrors()) {
        var errors = [];
        req.validationErrors().forEach(function (error) {
            errors.push(error.msg);
        });
    }
    console.log(errors);
    if (errors) {
        console.log("errors found aborting");
        res.render('login', {
            message: errors
        });
    }
    else {
        //checking for email and username are already taken
        user.findOne({ username: {
                "$regex": "^" + username + "\\b", "$options": "i"
            }}, function (err, account) {

            if (account) {
                console.log("account found");
                req.flash("error_msg", "Account already exists, please login");
                return res.redirect('/login');
            }
            else {
                //check nominees
                var newdependents = [];
                user.find({nominee1email:username}, function(err,foundDependents) {
                   if(foundDependents) {
                       console.log(username+"dependents are");
                       for(var i=0; i< foundDependents.length; i++) {
                            console.log(foundDependents[i]);
                           newdependents.push(foundDependents[i].username);
                       }
                   }
                });
                var newUser = new user({
                    firstName: firstName,
                    lastName: lastName,
                    dateOfBirthF:dateOfBirthF,
                    username: username,
                    password: password,
                    profilePic: null,
                    nominee1email: "",
                    nominee2email: "",
                    capsulesReceived: [],
                    capsulesSent: [],
                    confirm1: false,
                    confirm2: false,
                    dependents: newdependents
                });
                user.createUser(newUser, function (err, account) {
                    if (err){
                        console.log(user);
                        req.flash("error_msg", "Unable to create new account");
                        return res.redirect("/login");
                    }
                });
                req.flash('success_msg', 'You are registered and can now login');
                return res.redirect("/login");
            }
        });
    }
};

const login = function (req, res) {
    res.redirect('/');
};


module.exports = {
    registerUser: registerUser,
    createCapsule: createCapsule,
    releaseCapsule: releaseCapsule,
    updateAccount: updateAccount,
    login: login
};