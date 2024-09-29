import express from "express";
import { authorizeRoles, isAuthenticatedUser } from "../middleware/auth.js";
import { deleteOrder, getAllOrders, getSingleOrder, myOrders, newOrder, updateOrder } from "../controllers/OrderController.js";


const router = express.Router();


router.route("/order/new").post(isAuthenticatedUser, newOrder);

router.route("/order/:id").get(isAuthenticatedUser, getSingleOrder)

router.route("/orders/me").get(isAuthenticatedUser, myOrders)


router.route("/admin/orders").get(isAuthenticatedUser, authorizeRoles("Admin"), getAllOrders)

router.route("/admin/order/:id").put(isAuthenticatedUser, authorizeRoles("Admin"), updateOrder).delete(isAuthenticatedUser, authorizeRoles("Admin"), deleteOrder)

export default router;