var express = require("express");
var controller = require('../controllers/controllers');
var router = express.Router();
var passport = require("passport");

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
    res.render('userWelcome');
});
router.get("/blank", controller.blankRoute);
router.get("/release", controller.releaseRoute);
router.get("/account", controller.accountRoute);
router.get("/create", controller.createRoute);
router.get("/userWelcome", controller.userWelcomeRoute);
router.get("/userInbox",controller.userInboxRoute);
router.get("/account2", controller.account2Route);
router.get("/view/:id", controller.viewRoute);
router.get('/login',controller.loginRoute);

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
        //req.flash('error_msg','You are not logged in');
        res.redirect('login');
    }
}


router.post("/create", controller.createCapsule);
router.post("/release", controller.releaseCapsule);
router.post("/account", controller.updateAccount);



module.exports = router;
