//--------------------------------- admin login page Render ------------------------------


const login =(req,res) => {
    try{
      res.render('admin/login')
    }catch(error){
      console.log(`error while rendering user login`);
    }
  }

  module.exports={
    login
  }