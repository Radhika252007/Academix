const jwt = require('jsonwebtoken');
const pool = require('../config/db.js')
const verifyUser = (req,res,next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        res.status(401).json("Token Not Provided");
    }
    const token = authHeader.split(' ')[1];
    try{
        const payload = jwt.verify(token,process.env.JWT_SECRET);
        if(!payload){
            return res.status(401).json("No Token Provided");
        }
        req.user = payload;
    }catch(err){
        return res.status(401).json("Invalid Token");
    }
    next();
}
const generateToken = async (req,res,next)=>{
    try{
    const payload = req.user;
    console.log(payload);
    const token = jwt.sign(payload,process.env.JWT_SECRET,{
        expiresIn: '1h'
    });
    const refreshToken = jwt.sign(payload,process.env.JWT_REFRESH_SECRET,{
        expiresIn: '7d'
    });
    await pool.query('INSERT INTO sessions (user_id,token_hash,ip_address,user_agent,expires_at) VALUES ($1,$2,$3,$4,$5)',[req.user.user_id,refreshToken,req.ip,req.get('User-Agent'),new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);
    req.token = token;
    next();
}
catch(err){
    res.status(500).json("Internal Server Error");
}
}
const refreshToken = (req,res,next)=>{
     const authHeader = req.header.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        res.status(401).json("Token Not Provided");
    }
    const token = authHeader.split(' ')[1];
    const refreshToken = pool.query('SELECT * FROM sessions WHERE token_hash = $1',[token]);
    if(!refreshToken){
        return res.status(401).json("Invalid Refresh Token");
    }   
    const payload = jwt.verify(token,process.env.JWT_REFRESH_SECRET);
    if(!payload){
        return res.status(401).json("Invalid Refresh Token");       
    }
    next();
}
module.exports = {verifyUser,generateToken,refreshToken};