const pool = require('../config/db.js');
const bcrypt = require('bcrypt');
const loginProfessor = async (req,res,next)=>{
    try{
        const {email,password} = req.body;  
        const result = await pool.query('select * from users where email = $1',[email]);
        if(result.rows.length==0){
            return res.status(401).json("Invalid Credentials");
        }
        const user = result.rows[0];
        const isPassValid = bcrypt.compareSync(password,user.password_hash);
        if(!isPassValid){
            return res.status(401).json("Invalid Credentials");
        }   
        req.user = {user_id: user.id, role: user.role};
        next();
    }
    catch(err){ 
        console.log(err);
        res.status(500).json("Internal Server Error");
    }
};

const professorDetails = async (req,res)=>{
    try{
    const userId = req.user.user_id;
    const professorEmail = 'select email from users where id = $1';
    const professorEmailResult = await pool.query(professorEmail,[userId]);
    const query = 'select p.first_name || \' \' || p.last_name as full_name,p.email,p.phone_number,p.office_location,d.name as department_name from professors p join departments d on p.department_id = d.id where p.user_id = $1';
    const professorDetailsResult = await pool.query(query,[userId]);
    professorDetailsResult.rows[0].email = professorEmailResult.rows[0].email;
    res.status(200).json(professorDetailsResult.rows[0]);
}
catch(err){
    console.log(err);
    res.status(500).json("Internal Server Error");  
}
}

const registerProfessor = async (req,res,next)=>{

    const client = await pool.connect();    
    try{
        const {
            email,
            password,
            first_name,
            last_name,  
            phone_number,
            office_location,
            department_id
        } = req.body;
        const hashedPassword = await bcrypt.hash(password,10);
        await client.query('BEGIN');
        const userId = v4();
        await client.query('insert into users (id,email,password_hash,role) values ($1,$2,$3,$4)',[userId,email,hashedPassword,'professor']);
        await client.query('insert into professors (user_id,first_name,last_name,phone_number,office_location,department_id) values ($1,$2,$3,$4,$5,$6)',[userId,first_name,last_name,phone_number,office_location,department_id]);
        await client.query('COMMIT');
        req.user = {user_id: userId, role: 'professor'};
        next();
    }
    catch(err){
        await client.query('ROLLBACK');
        console.log(err);
        res.status(500).json("Internal Server Error");
    }
    finally{
        client.release();
    }
}
module.exports = {loginProfessor,professorDetails,registerProfessor};