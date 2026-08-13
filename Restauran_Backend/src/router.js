
const express = require("express");
const { loginController, signupController } = require("./controllers/auth.controller");
const { createItemController } = require("./controllers/item.controller");


const router = express.Router();

router.post("/auth/login", loginController)
router.post("/auth/sign-up", signupController)

router.post("/item", createItemController)

module.exports = router;

