var express = require("express");
var controller = require('../controllers/controllers');
var router = express.Router();


// Coming soon page
router.get('/', controller.comingSoonRoute);
router.get("/login", controller.loginRoute );
module.exports = router;
