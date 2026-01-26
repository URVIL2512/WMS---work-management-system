import express from "express"
import { register, login, logout, getMe, forgotPassword, resetPassword, getAllUsers, updateUserStatus, updateUser, deleteUser } from "../controllers/auth.controller.js"
import { authenticate, authorize } from "../middlewares/auth.middleware.js"

const router = express.Router()



router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)


router.post("/logout", authenticate, logout)
router.get("/me", authenticate, getMe)

router.post("/admin/create-user", authenticate, authorize("Admin"), register)
router.get("/users", authenticate, authorize("Admin"), getAllUsers)
router.put("/users/:id", authenticate, authorize("Admin"), updateUser)
router.patch("/users/:id/status", authenticate, authorize("Admin"), updateUserStatus)
router.delete("/users/:id", authenticate, authorize("Admin"), deleteUser)

export default router
