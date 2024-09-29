import express from "express";
import { deleteUser, forgotPassword, getAllUser, getSingleUser, getUserDetails, loginUser, logout, registerUser, resetPassword, updatePassword, updateProfile, updateUserRole } from "../controllers/UserController.js";
import { authorizeRoles, isAuthenticatedUser } from "../middleware/auth.js";


const router = express.Router()


router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/password/forgot").post(forgotPassword);

router.route("/password/reset/:token").put(resetPassword);

router.route("/logout").get(logout);

router.route("/me").get(isAuthenticatedUser, getUserDetails);

router.route("/password/update").put(isAuthenticatedUser, updatePassword);

router.route("/me/update").put(isAuthenticatedUser, updateProfile);

router.route("/admin/users").get(isAuthenticatedUser, authorizeRoles("Admin"), getAllUser);

router.route("/admin/user/:id").get(isAuthenticatedUser, authorizeRoles("Admin"), getSingleUser)
    .put(isAuthenticatedUser, authorizeRoles("Admin"), updateUserRole)
    .delete(isAuthenticatedUser, authorizeRoles("Admin"), deleteUser)



export default router;