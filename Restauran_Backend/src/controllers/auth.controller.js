const { insert, getOne } = require("../db/dao");
const generateJwtToken = require("../util/helper");


const loginController = async(req, res)=>{
    try{
        console.log(req.body)
        const {email, password} = req.body;

        const sql = `SELECT * FROM users WHERE email = ?`;
        const userResult = await getOne(sql, [email]);

        if(!userResult){
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const {password:userPassword, email:userEmail, full_name, user_id:userId} = userResult;
        if(userPassword==password){
            
            const token = generateJwtToken({email, fullName:full_name,userId})
            return res.status(200).json({
                message: "Successfully logged In",
                token
            })
        }

        return res.status(401).json({
            message: "Unauthorized"
        })

    }catch(ex){
        console.log(ex.message);
        res.status(500);
    }
}

const signupController = async(req, res)=>{
    try{
        const {fullName, email, password} = req.body;

        const sql = `INSERT INTO users (full_name, email, password)
                        VALUES(?, ?, ?)`;

        const params = [fullName, email, password];

        const result = await insert(sql, params);

        res.json({
            message: "Successfully created the user",
            data: {
                userId: result
            }
        })
    }
    catch(ex){
        console.log(ex.message)
        res.json({
            message: "internal server error"
        })
    }
}

module.exports = {loginController, signupController}