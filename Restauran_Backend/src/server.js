
const express = require("express");
const cors = require('cors');
const { loginController } = require("./controllers/auth.controller");
const { API_PREFIX } = require("./util/constant");
const router = require("./router");

const app = express();

app.use(express.json())

app.use(cors({
    origin: "*"
}))

app.get("/", (req, res)=>{
    res.send("Application is running");
});

app.use(API_PREFIX, router)


app.listen(3000, ()=>{
    console.log("Application running on http://localhost:3000")
})