const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./constant");

const generateJwtToken = (payload)=>{
    const token = jwt.sign(payload, JWT_SECRET)
    return token;
}

module.exports = generateJwtToken;