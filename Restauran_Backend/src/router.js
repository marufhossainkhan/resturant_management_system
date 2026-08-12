
const express = require("express");
const { loginController, signupController } = require("./controllers/auth.controller");


const router = express.Router();

router.post("/auth/login", loginController)
router.post("/auth/sign-up", signupController)

module.exports = router;

