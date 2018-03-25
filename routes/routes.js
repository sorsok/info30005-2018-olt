var express = require("express");
var controller = require('./../controllers/controllers');
var router = express.Router();

router.get('/', controller.rootRoute);
router.get("/users", controller.usersRoute);
router.get("/users/:id", controller.userRoute);

module.exports = router;