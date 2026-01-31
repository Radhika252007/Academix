const router = require('express').Router();
const {verifyUser, generateToken} = require('../middlewares/auth.middleware');
const {checkStudentRole} = require('../middlewares/role.middleware');
const {studentLogin,userDetails, registerStudent,} = require('../controllers/student');
const { getAttendance }= require('../controllers/attendance');
const {upload, assignmentUpload} = require('../middlewares/upload.js');
const multer = require('multer');
const {courseAssignments, submitCourseAssignment} = require('../controllers/courses');
const {getCourses} = require('../controllers/courses');


router.post('/student/login',studentLogin,generateToken,(req,res)=>{
    console.log(req.token);
    res.header('Authorization', `Bearer ${req.token}`);
    res.status(200).json({message: "Login Successful"});
});

router.get('/student/student-details',verifyUser,checkStudentRole,userDetails);

router.post(
  '/student/register',
  (req, res, next) => {
    upload.fields([
      { name: 'profile_photo', maxCount: 1 },
      { name: 'aadhaar_card', maxCount: 1 },
      { name: 'class12_certificate', maxCount: 1 },
      { name: 'medical_certificate', maxCount: 1 }
    ])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  registerStudent,
  generateToken,
  (req, res) => {
    res.status(201).json({ message: "Student Registered Successfully" });
  }
);


router.get('/student/attendance/courseId:courseId/year:year/month:month',verifyUser,checkStudentRole,getAttendance);

router.get('/student/courses',verifyUser,checkStudentRole,getCourses);

router.get('/student/courses/:courseId/assignments',verifyUser,checkStudentRole,courseAssignments);

router.post('/student/courses/:courseId/assignments/:assignmentId/submit',verifyUser,checkStudentRole,assignmentUpload.single('assignment_file'),submitCourseAssignment);

module.exports = router;