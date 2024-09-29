import express from "express";
import { config } from "dotenv";
import product from "./routes/ProductRoute.js";
import { errorMiddleware } from "./middleware/errorHandler.js";
import user from "./routes/UserRoute.js";
import cookieParser from "cookie-parser";
import order from "./routes/OrderRoute.js";
import cors from "cors"
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import payment from "./routes/PaymentRoute.js";

export const app = express()

// dotenv
config({ path: "./database/config.env" })




// Log the frontend URL
console.log("Frontend URL:", process.env.FRONTEND_URL);

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,

}))




// middleware
app.use(express.json({ limit: "50mb" }));                                                  // increase body size limit for JSON requests
app.use(cookieParser());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));                          // increase body size limit for form data
app.use(bodyParser.json({ limit: "50mb" }));                                                // increase body size limit for JSON requests via bodyParser

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },                                                 // 50 MB file size limit
}));




// Routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment)




app.get("/", (req, res) => {
    res.send("working")
})


// Using Error Middleware
app.use(errorMiddleware);



