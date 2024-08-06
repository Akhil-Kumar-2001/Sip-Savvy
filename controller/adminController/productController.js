const productSchema = require('../../model/productSchema')
const categorySchema = require('../../model/categorySchema')
const upload = require('../../middleware/multer')
const fs = require('fs')

const mongoose=require('mongoose')

//------------------Find product by search-------------------- 


const products = async(req,res)=>{
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1 ;
        const limit = parseInt(req.query.limit) || 5 ;
        
        
        
        
        //---- Fetch product with pagination ----
        const products = await productSchema.find({productName:{ $regex: search , $options:'i'} }).populate('productCategory')
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({updatedAt : -1})
        
        // ----Fetch the total numbet of products matching the search query ----
        
        const count = await productSchema.countDocuments({productName:{ $regex: search , $options: 'i'}})


        res.render('admin/products',{title:'Products',alertMessage:req.flash('alert'),
            products,
            totalPages:Math.ceil(count / limit),
            currentPage:page,
            search,
            limit,
            page
    
        })
        
    } catch (error) {
        console.log(`error while rendering product page ${error}`);
        res.status(500).send('server error');
    }
}


//------------------Add product render-------------------- 

const addProduct = async(req,res)=>{

    try {
        const productCategory = await categorySchema.find()
        res.render('admin/addproduct',{title:"Add Product",productCategory,alertMessage:req.flash('alert')})
    } catch (error) {
        console.log(`Error while rendering add product page ${error}`)
    }
}

//---------------------Multer upload-------------------------


const multer = upload.array('images',3);



//----------------------Add new product--------------------------

const addProductPost = async(req,res)=>{

    try {
    const imgArray = []
    
    req.files.forEach((img) => {
        imgArray.push(img.path)
    });


    const product = {
        productName: req.body.productName,
        productPrice: req.body.productPrice,
        productCategory: new mongoose.Types.ObjectId(req.body.productCategory),
        productQuantity: req.body.productQuantity,
        productDiscount: req.body.productDiscount,
        productDescription: req.body.productDescription,
        productImage: imgArray
    }

    const check = await productSchema.findOne({productName:product.productName,productCategory:product.productCategory})

        if(!check){
            await productSchema.insertMany(product)
            req.flash('alert','Product added Successfully')
        }else{
            req.flash('alert','Product already exists')
        }
        res.redirect('/admin/products')

    } catch (error) {
        console.log(`Error while adding new product ${error}`);
        req.flash('alert','Failed to add Product')
        res.redirect('/admin/addproduct')
    }
}


// ---------------Edit product page render------------------

const editProduct= async(req,res)=>{
    try {
        
        const id = req.params.id;
        const product = await productSchema.findById(id).populate('productCategory')
        console.log(product)
        if(product){
            res.render('admin/editproduct',
                {
                    title:"Edit Product",
                    product,
                    alertMessage:req.flash('alert'),
                    categoryName: product.productCategory.categoryName
                })
        }else{
            req.flash('alert','Unable to Edit the product')
            res.redirect('/admin/products')
        }

    } catch (error) {
        console.log(`Error while rendering the Edit product Page ${error}`);
    }
}

const editProductPost = async(req,res)=>{
    try {
        
        const id = req.params.id;
        const imageToDelete = JSON.parse(req.body.deletedImages || '[]');
        const croppedImages = JSON.parse(req.body.croppedImages || '[]');

         // Delete images from filesystem
         imageToDelete.forEach(imagePath => {
            try {
                fs.unlinkSync(imagePath);
            } catch (error) {
                console.error(`Error deleting image: ${imagePath}`, error);
            }
        });

         // Remove images from database
         if (imageToDelete.length > 0) {
            await productSchema.findByIdAndUpdate(id, {
                $pull: { productImage: { $in: imageToDelete } }
            });
        }

        // Save cropped images to filesystem and update paths
        const savedCroppedImages = [];
        croppedImages.forEach((imageData, index) => {
            const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
            const imagePath = `uploads/cropped_image_${id}_${Date.now()}_${index}.jpg`;
            fs.writeFileSync(imagePath, base64Data, 'base64');
            savedCroppedImages.push(imagePath);
        });

        const product = await productSchema.findById(id);
        // Update product with new images
        const newImages = [...product.productImage, ...savedCroppedImages];

        // const id = req.params.id;
        await productSchema.findByIdAndUpdate(id,{
                productPrice: req.body.productPrice,
                productQuantity: req.body.productQuantity,
                productDiscount: req.body.productDiscount,
                productDescription: req.body.productDescription,
                productImage: newImages,
            })
            
                req.flash('alert','Product Successfully Updated')
                res.redirect('/admin/products')
           


    } catch (error) {
        console.log(`Error while editing product post ${error}`);
        req.flash('alert',"Could not edit the product")
        res.redirect('/admin/products')
    }
}


// ----------------------Product Status------------------------


const status =async(req,res)=>{
    try {
        
        const {id,status} = req.query
        const newStatus = !(status === 'true')
        
        await productSchema.findByIdAndUpdate(id,{isActive:newStatus})
        res.redirect('/admin/products')
        
    } catch (error) {
        console.log(`Error while changing the status ${error}`);
    }
}


// ----------------------Product Status------------------------


const deleteProduct = async(req,res)=>{
    try {
        
        const id = req.params.id
        const img = await productSchema.findById(id)
        img.productImage.forEach(x=>{
            fs.unlinkSync(x)
        })

        const product = await productSchema.findByIdAndDelete(id)
        // console.log(product)

            if(product!=null){
                req.flash('alert','Product Successfully removed')
                res.redirect('/admin/products')
            }else{
                req.flash('alert','Unable to remove the Product')
                res.redirect('/admin/products')
            }
        
        } catch (error) {
            console.log(`error while deleting the product ${error}`);
        }
    }



module.exports = {
    products,
    addProduct,
    addProductPost,
    multer,
    editProduct,
    editProductPost,
    status,
    deleteProduct,




}