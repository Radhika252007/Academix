const router = require('express').Router();
const {verifyUser, generateToken} = require('../middlewares/auth.middleware');
const {checkProfessorRole} = require('../middlewares/role.middleware');
const {loginProfessor,professorDetails,registerProfessor} = require('../controllers/professor');
router.post('/professor/login',loginProfessor,generateToken,(req,res)=>{
    console.log(req.token);
    res.header('Authorization', `Bearer ${req.token}`);
    res.status(200).json({message: "Login Successful"});
});

router.get('/professor/details',verifyUser,checkProfessorRole,professorDetails);    

router.post('/professor/register',registerProfessor,generateToken,(req,res)=>{
    res.status(201).json({message: "Professor Registered Successfully"});
});
module.exports = router;