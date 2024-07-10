const userSchema = require('../../model/userSchema');
const { ObjectId } = require('mongodb');



// -------------------  Profile   --------------------- //

const profile = async(req,res)=>{

    try {
        const userId = req.session.user;
        const userDetail = await userSchema.findById(userId)

        if(!userId){
            req.flash('alert','User not found Please login again')
            return res.redirect('/login')
        }
        if(!userDetail){
            req.flash('alert','User Detail is not found, Please try agian later')
        }
        res.render('user/profile',{ title:'Profile',alertMessage:req.flash('alert'), user:req.session.user,userDetail})
    } catch(error) {
        
        console.log(`Error while Profile Page render ${error}`);
        res.status(404)
    }
}


// ----------------- User Update Profile--------------------

const updateProfile = async(req,res)=>{
    try {
        const userName = req.body.userName;
        const phone = req.body.phoneNumber
        // const [userName,phone] = req.body
        const profileUpdate = await userSchema.findByIdAndUpdate(req.session.user,{ name: userName, phone: phone })
        if(profileUpdate){
            req.flash('alert','Profile Updated');
        }else{
            req.flash('alert','Could not Update right now, Please try again after some time')
        }
        res.redirect('/profile')
    } catch (error) {
        console.log(`Error while Updating the Profile ${error}`)
    }
}

//------User Side Address Managment --------

const addAddress = async(req,res)=>{
    try {
        const userAddress ={
              building: req.body.building,
              street: req.body.street,
              city: req.body.city,
              phonenumber:req.body.phonenumber,
              pincode:req.body.pincode,
              landmark:req.body.landmark,
              state:req.body.state,
              country: req.body.country  
        }

        const user = await userSchema.findById(req.session.user)

        // If the Maximum Address limit reached this alert will show
            if(user.address.length > 3){
                req.flash('alert','Maximum Address limit reached')
                return  res.redirect('/profile')
            }
        // Add the new addredd to the Address
            user.address.push(userAddress)
        // Save the updated user document
            await user.save()

            req.flash('alert','Address added')
            res.redirect('/profile')
    } catch (error) {
        req.flash('alert','Error while adding new address, Please try again later')
        console.log(`Error while adding new address in the collection ${error}`)
    }
}


// ---------------Remove Address--------------

    const removeAddress = async(req,res)=>{
        try {
           const userId = req.session.user
           const index = parseInt(req.params.index,10) 

           const user = await userSchema.findById(userId).populate('address');
           if(!user){
            req.flash('alert','User not found')
            return res.redirect('/profile')
           }

           if(isNaN(index) || index < 0 || index > user.address.length){
            req.flash('alert','Invalid Address')
            return res.redirect('/profile')
           }

           user.address.splice(index,1)
           await user.save();

           req.flash('alert','Address Removed Successfully')
           res. redirect('/profile')
        } catch (error) {
            req.flash('alert','Error while removing the address')
            console.log(`Error while removing the Address ${error}`)
            res.redirect('/profile')
            
        }
    }

    // ------------ Edit address page load  -------------

    const editAddress = async(req,res)=>{
        const index = Number(req.params.index)
        const id = req.session.user;


        try {
            const getAddress = await userSchema.findOne({_id:id},{address:{$slice:[index,1]}});

            if(getAddress){
                res.render('user/editAddress',{title:'Edit Address',alertMessage:req.flash('alert'),data:getAddress.address[0],index,user:req.session.user});
            }
            else{
                res.redirect('/profile')
            }
        } catch (error) {
            req.flash('alert','error while entering edit address page, Please try again later')
            console.log(`Error while rendering address edit page ${error}`)
            res.redirect('/profile');
        }
    }


    // ----------------Update existing addresss--------------------

    const updateAddress = async(req,res)=>{
        const id = req.session.user
        const index = parseInt(req.params.index,10)
        const data = {
            building: req.body.building,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            county: req.body.country,
            pincode: req.body.pincode,
            phonenumber: req.body.phonenumber,
            landmark: req.body.landmark
        }
        try {
            const updateQuery = {};
            updateQuery[`address.${index}`] = data;
    
            await userSchema.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateQuery }
            );
            req.flash('alert','Address updated Successfully');
            res.redirect('/profile');

        } catch (error) {
            console.log(`error while editing the address ${error}`)
            req.flash('alert','Unable to update the address right now . Please try again later.');
            res.redirect(`/edit-address/${index}`); 
        }
    }



module.exports = {
    profile,
    updateProfile,
    addAddress,
    removeAddress,
    editAddress,
    updateAddress,



}
