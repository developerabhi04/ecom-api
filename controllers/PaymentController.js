import catchAsyncErrors from "../middleware/catchAsyncError.js";
import ErrorHandler from "../middleware/errorHandler.js";
import Stripe from 'stripe';



// Process the payment and send back the client secret
export const processPayment = catchAsyncErrors(async (req, res, next) => {
    try {

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        // Create a payment intent using Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: "inr",
            metadata: {
                company: "Nike-Ecommerce",
                secretKey: process.env.STRIPE_SECRET_KEY, // You can access SECRET_KEY directly
            },
        });

        // Respond with the client secret to the frontend
        res.status(200).json({
            success: true,
            client_secret: paymentIntent.client_secret,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Send Stripe publishable API key to frontend
export const sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {
    // Check for the presence of the Stripe publishable key
    const stripeApiKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!stripeApiKey) {
        return next(new ErrorHandler("Stripe publishable key is missing in environment variables", 500));
    }

    // Respond with the publishable key to the frontend
    res.status(200).json({
        stripeApiKey,
    });
});
