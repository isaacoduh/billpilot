import asyncHander from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const checkAuth = asyncHander(async (req, res, next) => {
  let jwt_token;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer")) return res.sendStatus(401);

  if (authHeader && authHeader.startsWith("Bearer")) {
    jwt_token = authHeader.split(" ")[1];
    jwt.verify(
      jwt_token,
      process.env.JWT_ACCESS_SECRET_KEY,
      async (err, decoded) => {
        if (err) return res.sendStatus(403);
        const userId = decoded.id;
        req.user = await User.findById(userId).select("-password");
        req.roles = decoded.roles;
        next();
      }
    );
  }
});

export default checkAuth;
