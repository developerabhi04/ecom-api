
// creating Token and saving in cookie
const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();

    // options for cookie
    const options = {
        httpOnly: true,
        maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000, // Convert days to milliseconds
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "development" ? false : true,
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        token,
    });
};

export default sendToken;