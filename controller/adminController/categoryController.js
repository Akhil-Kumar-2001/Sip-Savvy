const categorySchema = require("../../model/categorySchema");


        // -------------Finding category by search-----------------


const category=async(req,res)=>{
        try {
            const search = req.query.search || ''
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;

            const category =  await categorySchema.find({categoryName:{$regex:search ,$options:'i'}})
            .sort({updatedAt:-1})
            .limit(limit)
            .skip((page-1)*limit)


            const count = await categorySchema.countDocuments({ categoryName: { $regex: search, $options: 'i' } })

            res.render('admin/category',{title:'Category',alertMessage:req.flash('alert'),
            category,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search,
            limit,
            page})
        } catch (error) {
            console.log(`error while rendering category ${error}`);
        }
}

        // ---------------New category creating ------------------


const addCategoryPost = async(req,res)=>{
    try {
        const name = req.body.categoryName
        // console.log(name)
        const category ={
            categoryName:name,
            isActive:true
        }

        const checkCategory = await categorySchema.findOne({categoryName:{$regex:"name",$options:'i'}})

        if(checkCategory == null){
            await categorySchema.insertMany(category)
            .then(() => {
                req.flash('alert','new category added')
                res.redirect('/admin/category')
            })
            .catch(err=>{
                console.log(`error while creating new category ${err}`)
            })
        }else{
            req.flash('alert','Category already exist')
            res.redirect('/admin/category')
        }
    } catch (error) {
        console.log(`Error from add Category post ${error}`);
    }
}

        //----------------------------------- Active or block -----------------------------


        const status = async(req,res)=>{
            try {
                const categoryId=req.query.id
                const status = !(req.query.status=='true')
                const category = await categorySchema.findByIdAndUpdate(categoryId,{isActive:status})
                res.redirect('/admin/category')
            } catch (error) {
                console.log(`Error while status update ${error}`);
            }
        }


        //-----------------Delete a catogory-----------------------

        const deleteCategory = async(req,res)=>{
            try {
                const categoryId = req.params.id
                const deleteCategory = await categorySchema.findByIdAndDelete(categoryId)
                if(deleteCategory!=null){
                    req.flash('alert','Category deleted Successfully')
                    res.redirect('/admin/category')
                }else{
                    req.flash('alert','Unable to delete category')
                    res.redirect('/admin/category')
                }
            } catch (error) {
                console.log(`Error while deleting category ${error}`);
            }
        }


        //----------------------Edit a Category------------------------------

        const editCategory = async(req,res)=>{
            try {
               const {categoryId,categoryName} = req.body
               const editCategory = await categorySchema.findByIdAndUpdate(categoryId,{categoryName:categoryName}) 
               console.log(editCategory)
               if(editCategory != null){
                req.flash('alert','Category is Successfully Editted')
                res.redirect('/admin/category')
               }else{
                req.flash('alert','Unable to edit the Category')
                res.redirect('/admin/category')
               }
            } catch (error) {
                console.log(`Error while editing the Category ${error}`);
            }
        }


module.exports = {
    category,
    addCategoryPost,
    status,
    deleteCategory,
    editCategory
}