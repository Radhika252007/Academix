const pool = require('../config/db.js');
const getAttendance = async (req,res)=>{
    try{
        const {year,month,courseId} = req.query;
         if (!courseId || !year || !month) {
            return res.status(400).json("Missing parameters");
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const StudentRes = await pool.query('select id from students where user_id = $1',[req.user.user_id]);
        const studentId = StudentRes.rows[0].id;
        const query = 'select a.date, a.status from attendance a join course_enrollments ce on a.enrollment_id = ce.id where ce.student_id = $1 and ce.course_id = $2 and a.date BETWEEN $3 and $4 order by a.date';
        const result = await pool.query(query,[studentId,courseId,startDate,endDate]);
         res.status(200).json({
            courseId,
            year,
            month,
            attendance: result.rows
        });
    }
    catch(err){
        res.status(500).json({"error": "Internal Server Error"});
    }
}
module.exports = {getAttendance};