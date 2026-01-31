const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const studentRoutes = require('./routes/student');
const professorRoutes = require('./routes/professor');
const adminRoutes = require('./routes/admin');
const app = express();
app.use(helmet());
app.use(cors({
    origin: true, credentials: true
}));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false, 
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use('/api',studentRoutes);
app.use('/api',professorRoutes);
app.use('/api',adminRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server Running on Port ${PORT}`);
});
