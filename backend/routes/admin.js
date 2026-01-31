const router = require('express').Router();
const {EnrollToCourse} = require('../controllers/courses');
const {verifyUser} = require('../middlewares/auth.middleware');
const {checkAdminRole} = require('../middlewares/role.middleware');
router.post('/admin/studentenroll',verifyUser,checkAdminRole,EnrollToCourse);
module.exports = router;