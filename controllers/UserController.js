import catchAsyncErrors from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/errorHandler.js";
import User from "../models/UserModel.js";
import sendToken from "../utils/jwtToken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import cloudinary from "cloudinary"


// Register a User
export const registerUser = catchAsyncErrors(async (req, res, next) => {

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
    });


    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });

    sendToken(user, 201, res)

})


// Login User
export const loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    // checking if user has given password and email are both correct or not
    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email & Password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401))
    }

    // const token = user.getJWTToken()

    // res.status(200).json({
    //     success: true,
    //     token
    // })

    sendToken(user, 200, res)
});


// logout User
export const logout = catchAsyncErrors(async (req, res, next) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    })


    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
})


// Forgot Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler("User Not Found", 404));
    }

    // Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;

    // Email content: HTML version with a 15-minute validity warning
    const htmlMessage = `
        <div style="font-family: Arial, sans-serif; padding: 50px; max-width: 700px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="color: #b31616; text-align: center; margin-bottom: 10px;">Password Reset Request</h2>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">Hello, <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">You have requested to reset the password for your account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${resetPasswordUrl}" 
                   style="display: inline-block; background-color: #b31616; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; margin-top: 15px;">
                    Reset Password
                </a>
            </div>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">Please note that the above link is valid for 15 minutes only. After that, you will need to request a new password reset.</p>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border-top: 1px solid #ccc; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777; line-height: 1.5;">If the button above doesn't work, copy and paste the following link into your browser:</p>
            <p style="font-size: 12px; word-wrap: break-word; color: #007bff; line-height: 1.5;">
                <a href="${resetPasswordUrl}" style="color: #007bff; word-wrap: break-word;">${resetPasswordUrl}</a>
            </p>
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; line-height: 1.5;">Thank you for using our service. If you need further assistance, please contact us.</p>
        </div>
    `;

    // Plain text email fallback
    const plainMessage = `
        Password Reset Request:

        Hello ${user.name},

        You have requested to reset the password for your account. Please use the following link to reset your password:
        ${resetPasswordUrl}

        Please note that the link is valid for 15 minutes only. After that, you will need to request a new password reset.

        If you didn't request this, please ignore this email. Your password will remain unchanged.
        
        If the link above doesn't work, copy and paste the following URL into your browser:
        ${resetPasswordUrl}

        Thank you for using our service.
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password Recovery`,
            text: plainMessage,   // Plain text for non-HTML email clients
            html: htmlMessage,    // HTML content for email
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });

    } catch (error) {
        // Reset the token fields if email sending fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message, 500));
    }
});






// Reset Password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {

    // creating token hash
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
        return next(new ErrorHandler("Reset Password Token is invalid or has been expired", 400));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not Match", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
})


// Get User Detail
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,
    })
})


// Update User Password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password does not match", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400))
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user, 200, res);
});


// update User Profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    // cloudinary 
    if (req.body.avatar !== "") {
        const user = await User.findById(req.user.id);

        const imageId = user.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    }



    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    sendToken(user, 200, res);
})


// Get all users (admin)
export const getAllUser = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});




// Get Single user (admin)
export const getSingleUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not exist with id: ${req.params.id}`))
    }

    res.status(200).json({
        success: true,
        user,
    });
});



// update User Profile Role --Admin
export const updateUserRole = catchAsyncErrors(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }

    // We will add cloudinary later

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });


    res.status(200).json({
        success: true,
    })
})

// delete User --Admin
export const deleteUser = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.params.id);


    if (!user) {
        return next(new ErrorHandler(`User does not exist with Id: ${req.params.id}`, 400))
    }


    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);



    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User Deleted SuccessFully"
    })
})