var express = require("express");
var controller = require('../controllers/controllers');
var router = express.Router();



router.get('/', controller.comingSoonRoute);
router.get("/login", controller.loginRoute );
router.get("/blank", controller.blankRoute);
router.get("/unlock", controller.unlockRoute);
router.get("/account", controller.accountRoute);
router.get("/create", controller.createRoute);
router.get("/userWelcome", controller.userWelcomeRoute);
router.get("/userInbox",controller.userInboxRoute);
router.get("/account2", controller.account2Route);
router.get("/view", controller.viewRoute);
module.exports = router;
