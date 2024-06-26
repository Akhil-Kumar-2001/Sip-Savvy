

//----------Admin route---------

const admin = (req,res) => {
  try {
    if(req.session.admin){
      res.redirect('/admin/dashboard')
    }else{
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(`error while redirect to admin`);
  }
}


//--------------------------------- admin login get route ------------------------------

const login =(req,res) => {
  try{
    if(req.session.admin){
      res.redirect('/admin/dashboard')
    }else{
      res.render('admin/login',{title:'Admin login',alertMessage:req.flash('alert')})
    }
    }catch(error){
      console.log(`error while rendering user login ${error}`);
    }
  }


//---------------Admin  login post route------------------

  const loginPost = (req,res)=>{
    try {
      if(req.body.email=== process.env.ADMIN_USERNAME && req.body.password===process.env.ADMIN_PASSWORD){
        req.session.admin = req.body.email
        res.redirect('/admin/dashboard')
      }else{
        req.flash('alert','Invalid username or password')
        res.redirect('/admin/login')
      }
    } catch (error) {
      
    }
  }


  //------------------------- admin home get request --------------------

const dashboard = (req,res)=>{
  try {
      res.render('admin/dashboard',{title: "Dashboard",alertMessage:req.flash('alert')})
  } catch (error) {
      console.log(`error from home ${error}`)
  }
}

//--------------------------------------- User logout -----------------------------------

const logout = (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.log(err)
      }
    })
    res.redirect('/admin/login')
  } catch (error) {
    console.log(`error while logout user ${error}`)
  }
}


  module.exports={
    admin,
    dashboard,
    login,
    loginPost,
    logout

  }