import catchAsyncErrors from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/errorHandler.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";


export const newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(201).json({
        success: true,
        order,
    })
})



// get Single Order
export const getSingleOrder = catchAsyncErrors(async (req, res, next) => {

    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        return next(new ErrorHandler("Order not found with this Id", 404));
    }

    res.status(200).json({
        success: true,
        order,
    })
})


// get logged in user Order
export const myOrders = catchAsyncErrors(async (req, res, next) => {

    const orders = await Order.find({ user: req.user._id });

    res.status(200).json({
        success: true,
        orders,
    })
})


// get all Order---admin
export const getAllOrders = catchAsyncErrors(async (req, res, next) => {

    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders,
    })
})


// update Order status---admin
export const updateOrder = catchAsyncErrors(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order not found with this Id", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("You have already delivered this order", 400))
    }

    // order.orderItems.forEach(async (order) => {
    //     await updateStock(order.product, order.quantity);
    // })

    if (req.body.status === "Shipped") {
        order.orderItems.forEach(async (o) => {
            await updateStock(o.product, o.quantity);
        });
    }

    order.orderStatus = req.body.status;

    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
    })
})

async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    product.Stock = product.Stock - quantity;

    await product.save({ validateBeforeSave: false })
}




// delete Order---admin
export const deleteOrder = catchAsyncErrors(async (req, res, next) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order not found with this Id", 404));
    }

    await order.deleteOne()

    res.status(200).json({
        success: true,
        message: "delete successfully"
    })
})