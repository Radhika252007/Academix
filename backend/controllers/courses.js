const pool = require('../config/db.js');
const getCourses = async (req,res)=>{
    try{
        const studentRes = await pool.query('select id from students where user_id = $1',[req.user.user_id]);
        const studentId = studentRes.rows[0].id;
        const query = 'select c.id, c.course_code, c.course_name,c.credits,d.name as department_name, p.first_name || \' \' || p.last_name as professor_name, from courses c join course_enrollments ce on ce.course_id = c.id join departments d on c.department_id = d.id join professors p on ce.professor_id = p.id where ce.student_id = $1';
        const result = await pool.query(query,[studentId]);
        res.status(200).json(result.rows);
    }
    catch(err){
        res.status(500).json({"error": "Internal Server Error"});
    }       
}

const EnrollToCourse = async (req,res)=>{
    try{
        const {courseId, student_id} = req.body;
        const course = await pool.query('select * from courses where id = $1',[courseId]);
        if(course.rows.length==0){
            return res.status(404).json("Course Not Found");
        }
        const studentRes = await pool.query('select id from students where student_id = $1',[student_id]);
        const studentId = studentRes.rows[0].id;
        insertQuery = 'insert into course_enrollments (student_id,course_id) values ($1,$2)';
        await pool.query(insertQuery,[studentId,courseId]);
        res.status(200).json("Enrolled Successfully");  
    }
    catch(err){
        res.status(500).json({"error": "Internal Server Error"});
    }
}

const courseAssignments = async (req,res)=>{
    try{
        const {courseId} = req.params;      
        const studentRes = await pool.query('select id from students where user_id = $1',[req.user.user_id]);
        const studentId = studentRes.rows[0].id;
        const enrollmentRes = await pool.query('select id from course_enrollments where student_id = $1 and course_id = $2',[studentId,courseId]);  
        if(enrollmentRes.rows.length==0){
            return res.status(403).json("Not Enrolled in this Course");
        }
        const enrollmentId = enrollmentRes.rows[0].id;
        const query = 'select a.id, a.title, a.description, a.due_date from assignments a where a.course_id = $1';
        const result = await pool.query(query,[courseId]);
        res.status(200).json(result.rows);
    }
    catch(err){
        res.status(500).json({"error": "Internal Server Error"});
    }   
}

const submitCourseAssignment = async (req,res)=>{
    try{
        const assignmentId = req.params.assignmentId;
        const fileUrl = req.body.fileUrl;
        const studentRes = await pool.query('select id from students where user_id = $1',[req.user.user_id]);
        const studentId = studentRes.rows[0].id;
        const assignmentRes = await pool.query('select due_date from assignments where id = $1',[assignmentId]);
        if(assignmentRes.rows.length==0){
            return res.status(404).json("Assignment Not Found");
        }
        const dueDate = assignmentRes.rows[0].due_date;
        const currentDate = new Date();
        if(currentDate > dueDate){
            return res.status(400).json("Assignment is Overdue");
        }
        const insertQuery = 'insert into assignment_submissions (assignment_id,student_id,file_url) values ($1,$2,$3)';
        await pool.query(insertQuery,[assignmentId,studentId,fileUrl]);
        res.status(200).json("Assignment Submitted Successfully");
    }
    catch(err){
        res.status(500).json({"error": "Internal Server Error"});
    }
}
module.exports = {getCourses,EnrollToCourse,courseAssignments,submitCourseAssignment};