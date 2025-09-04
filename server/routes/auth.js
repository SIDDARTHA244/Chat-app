const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

// ✅ Test route (to check if backend is reachable)
router.get("/test", (req, res) => {
  res.json({ message: "Auth API is working 🚀" });
});

// User registration
router.post("/register", register);

// User login
router.post("/login", login);

module.exports = router;
