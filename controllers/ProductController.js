
import catchAsyncErrors from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/errorHandler.js";
import Product from "../models/ProductModel.js"
import ApiFeatures from "../utils/apiFeatures.js";
import cloudinary from "cloudinary"

// create Product  ---Admin
export const createProduct = catchAsyncErrors(async (req, res, next) => {
    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }


    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
        });

        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
        });
    }

    req.body.images = imagesLinks;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product,
    })
})


// Get All Product
export const getAllProducts = catchAsyncErrors(async (req, res, next) => {

    const resultPerPage = 6;
    const productsCount = await Product.countDocuments()

    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter()
    // .pagination(resultPerPage);

    let products = await apiFeature.query;
    let filteredProductsCount = products.length;
    apiFeature.pagination(resultPerPage)


    products = await apiFeature.query.clone()
    // const products = await Product.find();



    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    })
})


// Get All Product (admin)
export const getAllAdminProducts = catchAsyncErrors(async (req, res, next) => {

    const products = await Product.find()

    res.status(200).json({
        success: true,
        products,
    })
})





// Get Product Details
export const getProductDetails = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not Found", 404))
    }
    // if (!product) {
    //     return res.status(500).json({
    //         success: false,
    //         message: "Product not found"
    //     })
    // }

    res.status(200).json({
        success: true,
        product,
    })
})


// Update Product --Admin
export const updateProduct = catchAsyncErrors(async (req, res) => {

    let product = await Product.findById(req.params.id)

    if (!product) {
        return next(new ErrorHandler("Product not Found", 404))
    }
    

    // Images Start Here
    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    if (images !== undefined) {
        // Deleting Images From Cloudinary
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });
        }

        req.body.images = imagesLinks;
    }



    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        product
    })
})


// Delete Product
export const deleteProduct = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product not Found", 404))
    }


    // deleting Images from cloudinary
    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }
    // deleting bannerImages from cloudinary
    for (let i = 0; i < product.banner.length; i++) {
        await cloudinary.v2.uploader.destroy(product.banner[i].public_id);
    }
    // deleting bannerImagess from cloudinary
    for (let i = 0; i < product.banners.length; i++) {
        await cloudinary.v2.uploader.destroy(product.banners[i].public_id);
    }


    await Product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product Delete successfully"
    })
})



// Create New Review or update the review

export const createProductReview = catchAsyncErrors(async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString());


    if (isReviewed) {
        product.reviews.forEach((rev) => {
            if (rev.user.toString() === req.user._id.toString()) {
                (rev.rating = rating), (rev.comment = comment);
            }
        });

    } else {
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    };


    let avg = 0;

    product.reviews.forEach((rev) => {
        avg = avg + rev.rating;
    })

    product.ratings = avg / product.reviews.length;


    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        product
    })

});


// get All Reviews of a product
export const getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews,
    })
})

// delete Review
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());



    let avg = 0;

    reviews.forEach((rev) => {
        avg = avg + rev.rating;
    })


    let ratings = 0;

    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }


    const numOfReviews = reviews.length;


    await Product.findByIdAndUpdate(req.query.productId,
        {
            reviews,
            ratings,
            numOfReviews,
        }, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    })




    res.status(200).json({
        success: true,
        message: "Review Delete successfully"
    })

})