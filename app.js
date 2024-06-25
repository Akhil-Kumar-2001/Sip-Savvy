const express = require('express');
const app = require('express')();
const path = require('path');
const expressLayouts=require('express-ejs-layouts')



//----------------------- Requiring Routes -------------------------

const adminRoutes = require('./routes/adminRoutes')
const userRoutes = require('./routes/userRoutes')


//----------------------- port setting -------------------------


const port = process.env.PORT || 7275





//--------------------- Setting view engine --------------------

app.set('view engine','ejs');




//-----------------------public static files -------------------

app.use('/public', express.static(path.join(__dirname,'public')));




//------------------------- url encoded data -------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true}));




// --------------Routes------------- //

app.use('/', userRoutes);
app.use('/admin', adminRoutes)

// setting express layouts
app.use(expressLayouts);
app.set('layout','./layouts/layout')

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
    res.send("Page not found!");
})


// ----------------Server listening----------------- //

app.listen(port,(err)=>{
    if(err){
        console.log("Error while listening port")
    }else{
        console.log(`Server listening to  http://localhost:${port}`)
    }
})