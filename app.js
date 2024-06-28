const express = require('express');
const path = require('path');
const nocache = require('nocache')
const expressLayouts=require('express-ejs-layouts')
const flash = require('connect-flash')
 require("dotenv").config()
const session = require('express-session')
const {v4: uuidv4} = require('uuid')





const app = express()
const connectDB = require("./config/connection")


//----------------------- Requiring Routes -------------------------

const adminRoutes = require('./routes/adminRoutes')
const userRoutes = require('./routes/userRoutes')


//----------------------- port setting -------------------------


const port = process.env.PORT || 7275



//--------------------- mongodb connection ---------------------

connectDB()


//--------------------- Setting view engine --------------------

app.use(flash())

app.use(expressLayouts);
app.set('layout', './layouts/layout')
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// app.use((req,res,next)=>{
//     res.locals.errorMessage = req.flash('alertMessage');
//     next();
// })

//-----------------------public static files -------------------

app.use('/public', express.static(path.join(__dirname,'public')));




//------------------------- url encoded data -------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true}));


//-------------Middlewares----------------
    
app.use(nocache())

app.use(session({
    secret: uuidv4(),
    resave:false,
    saveUninitialized:false
}))

// setting express layouts
app.use(expressLayouts);
app.set('layout','./layouts/layout')

// --------------Routes------------- //

app.use('/', userRoutes);
app.use('/admin', adminRoutes)


// --------------------First Route ------------------ //


app.get("/",(req,res)=>{
    try {
        res.redirect('/user')
    } catch (error) {
        console.log(`error from main route ${error}`)
    }
})




//  --------------Page not found---------------- //

app.use("*",(req,res)=>{
    // res.send("Page not found!");
    res.render('user/pagenotfound',{title:"404 page"})
})




// ----------------Server listening----------------- //

app.listen(port,(err)=>{
    if(err){
        console.log("Error while listening port")
    }else{
        console.log(`Server listening to  http://localhost:${port}`)
    }
})



