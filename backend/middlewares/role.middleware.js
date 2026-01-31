const pool = require('../config/db.js');
const checkStudentRole = (req,res,next)=>{
    const userRole = req.user.role;
    if(userRole!='student'){
        return res.status(403).json("Access Denied");
    }
    next();
};
const checkAdminRole = (req,res,next)=>{
    const userRole = req.user.role;
    if(userRole!='admin'){
        return res.status(403).json("Access Denied");
    }
    next();
}
const checkProfessorRole = (req,res,next)=>{    
    const userRole = req.user.role;
    if(userRole!='professor'){
        return res.status(403).json("Access Denied");
    }
    next();
}
module.exports = {checkStudentRole,checkAdminRole,checkProfessorRole};