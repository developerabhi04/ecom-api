import express from "express";
import { createProduct, createProductReview, deleteProduct, deleteReview, getAllAdminProducts, getAllProducts, getProductDetails, getProductReviews, updateProduct } from "../controllers/ProductController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middleware/auth.js";


const router = express.Router();



router.route("/products").get(getAllProducts);

router.route("/admin/products").get(isAuthenticatedUser, authorizeRoles("Admin"), getAllAdminProducts);

router.route("/product/:id").get(getProductDetails)

router.route("/admin/product/new").post(isAuthenticatedUser, authorizeRoles("Admin"), createProduct);

router.route("/admin/product/:id")
    .put(isAuthenticatedUser, authorizeRoles("Admin"), updateProduct)
    .delete(isAuthenticatedUser, authorizeRoles("Admin"), deleteProduct)




router.route("/review").put(isAuthenticatedUser, createProductReview);

router.route("/reviews").get(getProductReviews).delete(isAuthenticatedUser, deleteReview)

export default router;