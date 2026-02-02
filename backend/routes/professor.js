const router = require('express').Router();
const {verifyUser, generateToken} = require('../middlewares/auth.middleware');
const {checkProfessorRole} = require('../middlewares/role.middleware');
const {loginProfessor,professorDetails,registerProfessor, getAssignedClasses, getStudents} = require('../controllers/professor');
const {markAttendance} = require('../controllers/attendance');
const {giveAssignments} = require('../controllers/courses');
router.post('/professor/login',loginProfessor,generateToken,(req,res)=>{
    console.log(req.token);
    res.header('Authorization', `Bearer ${req.token}`);
    res.status(200).json({message: "Login Successful"});
});

router.get('/professor/details',verifyUser,checkProfessorRole,professorDetails);    

router.post('/professor/register',registerProfessor,generateToken,(req,res)=>{
    res.status(201).json({message: "Professor Registered Successfully"});
});

router.post('/professor/markAttendance/courseId:courseId',verifyUser,checkProfessorRole,markAttendance);

router.get('/professor/getmyClasses',verifyUser,checkProfessorRole,getAssignedClasses);

router.get('/professor/getStudents/groupNumber:groupNumber',verifyUser,checkProfessorRole,getStudents);

router.post('/professor/giveAssignment/courseId:courseId/gorupNumber:groupNumber',verifyUser,checkProfessorRole,giveAssignments);

module.exports = router;