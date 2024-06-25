//--------------------------------- user login page Render ------------------------------


  const login =(req,res) => {
    try{
      res.render('user/login')
    }catch(error){
      console.log(`error while rendering user login`);
    }
  }

  module.exports={
    
    login
  }