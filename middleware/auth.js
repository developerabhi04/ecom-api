import User from "../models/UserModel.js";
import catchAsyncErrors from "./catchAsyncError.js";
import ErrorHandler from "./errorHandler.js";
import jwt from "jsonwebtoken";

export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {

    const { token } = req.cookies;
    // console.log(token);\

    if (!token) {
        return next(new ErrorHandler("Please Login to access this resource", 401))
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);

    next();
})


// admin Authorize
export const authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`, 403))
        }

        next();
    };
};


