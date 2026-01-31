const pool = require('../config/db.js');
const bcrypt = require('bcrypt');
const v4 = require('uuid').v4;

const studentLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json("Invalid Credentials");
        }

        const user = result.rows[0];
        const isPassValid = bcrypt.compareSync(password, user.password_hash);
        if (!isPassValid) {
            return res.status(401).json("Invalid Credentials");
        }
        req.user = { user_id: user.id, role: user.role };
        next(); 
    } catch (err) {
        console.error(err);
        res.status(500).json("Internal Server Error");
    }
};

const userDetails = async (req,res)=>{
    try{
    const userId = req.user.user_id; 
    const studentEmail = 'select email from users where id = $1';
    const studentEmailResult = await pool.query(studentEmail,[userId]);
    if(studentEmailResult.rows.length==0){
        return res.status(404).json("User Not Found");
    } 
    const query = 'select s.first_name || \' \' || s.last_name as full_name,s.student_gender,s.date_of_birth,s.group_number,p.father_name,p.mother_name,p.father_phone,p.mother_phone,s.address,d.name,s.semester from students s left join parents p on s.id = p.student_id left join departments d on s.department_id = d.id where s.user_id = $1';
    const studentDetails = await pool.query(query,[userId]);
    if(studentDetails.rows.length==0){      
        return res.status(404).json("Student Details Not Found");
    }
    studentDetails.rows[0].email = studentEmailResult.rows[0].email;
    return res.status(200).json(studentDetails.rows[0]);
}
catch(err){
    console.log(err);
    res.status(500).json("Internal Server Error");  
}
}

const registerStudent = async (req,res,next)=>{

    const client = await pool.connect();
    try{
        const {
            email,
            password,
            first_name,
            last_name,  
            date_of_birth,
            student_id,
            student_gender,
            address,
            enrollment_date,
            phone_number,
            father_name,
            mother_name,
            father_phone,   
            mother_phone,
            department_code,
            semester,
            group_number,
            parent_email,
        } = req.body;

        if(!email || !password || !first_name || !last_name || !date_of_birth || !student_id || !student_gender || !address || !phone_number || !father_name || !mother_name || !father_phone || !mother_phone || !department_code || !semester || !group_number || !parent_email){
            return res.status(400).json("All fields are required");
        }   

        const hashedPassword = await bcrypt.hash(password,10);

        await client.query('BEGIN');

        const userId = v4(); 
        // Insert into Users Table   
        await client.query('Insert into users (id,email,password_hash,role) values ($1,$2,$3,$4)',[userId,email,hashedPassword,'student']);

        //Insert into Student Table
        const studentRes = await client.query('insert into students (user_id,first_name,last_name,date_of_birth,student_id,student_gender,address,phone_number,department_id,semester,group_number,enrollment_date,profile_picture_url) values ($1,$2,$3,$4,$5,$6,$7,$8,(select id from departments where code = $9),$10,$11,$12,$13) returning id',[userId,first_name,last_name,date_of_birth,student_id,student_gender,address,phone_number,department_code,semester,group_number,enrollment_date,req.files?.profile_photo?.[0]?.path || null]);
        const studentDbId = studentRes.rows[0].id;

        const docsFields = ['aadhaar_card','class12_certificate','medical_certificate'];
        for(const field of docsFields){
            if(req.files?.[field]){
                const file = req.files[field][0];
                await client.query(
                    `insert into student_documents
                    (student_id, doc_type, file_url, public_id) values ($1, $2, $3, $4)`,
                    [studentDbId, field, file.path, file.filename]
                );
            }
        }
        //Insert into Parents Table
        await client.query('insert into parents (student_id,father_name,mother_name,father_phone,mother_phone,email) values ((select id from students where user_id = $1),$2,$3,$4,$5,$6)',[userId,father_name,mother_name,father_phone,mother_phone,parent_email]);

        // If all okay, then commit
        await client.query('COMMIT');

        //attach the data to generate token
        req.user = { user_id: userId, role: 'student' };
        next();
    }catch(err){
        // If any problem then rollback
        await client.query('ROLLBACK');
    res.status(500).json({error : "Internal Sever Error"}); 
    }
    finally{
        client.release();
    }
}

const studentProfessors = async (req,res)=>{
    try{
        const userId = req.user.user_id;    
        const studentRes = await pool.query('select id from students where user_id = $1',[userId]);
        const studentId = studentRes.rows[0].id;
        const query = 'select p.first_name || \' \' || p.last_name as professor_name, p.email,p.profile_picture_url,p.office_location, d.name as department_name from professors p join course_enrollments ce on p.id = ce.professor_id join courses c on ce.course_id = c.id join departments d on p.department_id = d.id where ce.student_id = $1';
        const result = await pool.query(query,[studentId]);
        res.status(200).json(result.rows);
    }
    catch(err){
        res.status(500).json({"error": "Internal Server Error"});
    }   
}

const studentEvents = async (req,res)=>{
    try{
        const userId = req.user.user_id;    
        const studentRes = await pool.query('select id from students where user_id = $1',[userId]);
        const studentId = studentRes.rows[0].id;
        const query = 'select course_id from course_enrollments where student_id = $1';
        const coursesRes = await pool.query(query,[studentId]);
        const courseIds = coursesRes.rows.map(row=>row.course_id);
        if(courseIds.length===0){
            return res.status(200).json([]);
        }   
        const eventsQuery = `
SELECT DISTINCT
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.location,
    e.event_type,
    e.target_audience,
    c.course_name,
    d.name AS department_name
FROM events e
LEFT JOIN courses c ON e.course_id = c.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN course_enrollments ce
    ON ce.course_id = e.course_id
   AND ce.student_id = $1
WHERE
    e.is_active = TRUE
    AND (
        e.target_audience = 'all'
        OR e.target_audience = 'students'
        OR (
            e.target_audience = 'specific_department'
            AND e.department_id = (
                SELECT department_id
                FROM students
                WHERE id = $1
            )
        )
        OR (
            e.target_audience = 'specific_course'
            AND ce.student_id IS NOT NULL
        )
    )
ORDER BY e.event_date;
`;
        const eventsRes = await pool.query(eventsQuery,[studentId]);
        res.status(200).json(eventsRes.rows);   
    }
    catch(err){
        res.status(500).json({"error": "Internal Server Error"});   
    }
}

module.exports = { studentLogin, userDetails ,registerStudent,studentProfessors,studentEvents};