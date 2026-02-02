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
        const {courseCode, student_id} = req.body;
        const course = await pool.query('select * from courses where course_code = $1',[courseCode]);
        if(course.rows.length==0){
            return res.status(404).json("Course Not Found");
        }
        const courseId = course.rows[0].id;
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
        const studentRes = await pool.query('select id, group_number from students where user_id = $1',[req.user.user_id]);
        const studentId = studentRes.rows[0].id;
        const groupNumber = studentRes.rows[0].group_number;
        const enrollmentRes = await pool.query('select id from course_enrollments where student_id = $1 and course_id = $2',[studentId,courseId]);  
        if(enrollmentRes.rows.length==0){
            return res.status(403).json("Not Enrolled in this Course");
        }
        const query = 'select a.id, a.title, a.description, a.due_date from assignments a where a.course_id = $1 and a.group_number = $2';
        const result = await pool.query(query,[courseId, groupNumber]);
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

const giveAssignments = async (res,req)=>{
    try{
        const professorRes = pool.query('select id from professors where user_id = $1',[req.user.user_id]);
        const professorId = professorRes.rows[0].id;
        const {courseId, groupNumber} = req.params;
        const {title, description,dueDate, maxMarks} = req.body;
        const client = pool.connect();
        await client.query('BEGIN');
        const assignmentRes = await client.query('insert into assignments (course_id, title, description, due_date, max_marks,created_by, group_number,file_attached) values $1, $2,$3, $4, $5, $6, $7 returning id',[courseId,title,description,dueDate,maxMarks,professorId,groupNumber,req.file]);
        await client.query('COMMIT');
        res.status(201).json({message: "Assignment Created Successfully"});
    }
    catch(err){
        await client.query('ROLLBACK');
        res.status(500).json({error: "Internal Server Error"});
    }
}
module.exports = {getCourses,EnrollToCourse,courseAssignments,submitCourseAssignment,giveAssignments};