const pool = require('../config/db.js');
const getAttendance = async (req, res) => {
    try {
        const { year, month, courseId } = req.query;
        if (!courseId || !year || !month) {
            return res.status(400).json("Missing parameters");
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const StudentRes = await pool.query('select id from students where user_id = $1', [req.user.user_id]);
        const studentId = StudentRes.rows[0].id;
        const query = 'select a.date, a.status from attendance a join course_enrollments ce on a.enrollment_id = ce.id where ce.student_id = $1 and ce.course_id = $2 and a.date BETWEEN $3 and $4 order by a.date';
        const result = await pool.query(query, [studentId, courseId, startDate, endDate]);
        res.status(200).json({
            courseId,
            year,
            month,
            attendance: result.rows
        });
    }
    catch (err) {
        res.status(500).json({ "error": "Internal Server Error" });
    }
}

const markAttendance = async (req, res, next) => {
    const { courseId } = req.params;
    const { date, attendance } = req.body;
    const userId = req.user.id;
    const professor = pool.query('select id from professors where user_id = $1', [userId]);

    const enrollments = await pool.query(
    `
    SELECT
      ce.id AS enrollment_id,
      s.student_id AS public_student_id
    FROM course_enrollments ce
    JOIN students s ON s.id = ce.student_id
    WHERE ce.course_id = $1
      AND ce.professor_id = $2
    `,
    [courseId, professor.id]
  );

    if(!enrollments.length){
        res.status(403).json({message : "Not authorized for this course"});
    }

    const enrollmentMap = Object.fromEntries(
    enrollments.map(e => [e.public_student_id, e.enrollment_id])
  );

  for(const record of attendance){
    const enrollmentId = enrollmentMap[record.studentId];
    if(!enrollmentId) continue;
    await pool.query(`insert into attendance (enrollment_id, date, status, marked_by values ($1, $2, $3, $4)
        on conflict (enrollment_id, date)
        do update set 
        status = EXCLUDED.status,
        marked_by = EXCLUDED.marked_by,
        marked_at = CURRENT_TIMESTAMP`,[enrollmentId, date, record.status, userId]);
  }
  res.json({
    success : true,
    message: 'Atttendance marked successfully'
  });
};


module.exports = { getAttendance, markAttendance };