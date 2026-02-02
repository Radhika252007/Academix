const multer = require('multer');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');


const sanitize = (val) => {
    if (!val) return 'unknown';
    const newVal = val.toString().trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return newVal;
};
const storage = new CloudinaryStorage({
    cloudinary : cloudinary,
    params: (req,file)=>{
        const department = sanitize(req.body.department_code);
        const student_id = sanitize(req.body.student_id);
    
    const res = {
        folder: `student_portal/${department}/${student_id}`,
        allowed_formats : ['jpg','jpeg','png','pdf'],
        public_id : `${file.fieldname}_${Date.now()}`,
        resource_type : 'auto'
    };
    // console.log(res);
    return res;
  }
});
const upload = multer({
    storage,
    limits: {fileSize: 5*1024*1024}
});

const assignmentStorage = new CloudinaryStorage({
    cloudinary : cloudinary,
    params: (req,file)=>{
        const courseId = sanitize(req.params.courseId);
        const studentId = sanitize(req.user.user_id); 
        const assignment_id = sanitize(req.params.assignmentId);  
        const res = {
            folder: `student_portal/assignments/course_${courseId}/student_${studentId}/assignment_${assignment_id}`,
            allowed_formats : ['pdf','doc','docx','zip'],
            public_id : `${file.fieldname}_${Date.now()}`,
            resource_type : 'auto'
        };
        // console.log(res);
        return res;
  }
});

const assignmentUpload = multer({
    storage: assignmentStorage,
    limits: {fileSize: 20*1024*1024}
});

const assignmentProvidedStorage = new CloudinaryStorage({
    cloudinary : cloudinary, 
    params: (req,res)=>{
        const courseId = sanitize(req.params.courseId);
        const groupNumber = sanitize(req.params.groupNumber);
        const res = {
            folder : `student_portal/assignedAssignmentFiles/course_${courseId}/group_number${groupNumber}`,
            allowed_formats: ['pdf','docx','png','jpg','jpeg'],
            public_id: `${file.fieldname}_${Date.now()}`,
            resource_type: 'auto'
        };
return res;
    }
})

const assignmentProvidedUpload = multer({
    storage: assignmentProvidedStorage,
    limits: {fileSize: 20*1024*1024}
});
module.exports = {upload,assignmentStorage,assignmentUpload,assignmentProvidedUpload};