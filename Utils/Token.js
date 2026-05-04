import jwt from "jsonwebtoken";

export const Usertoken = (User) => {
  return jwt.sign(
    {
      id: User._id,
      role: User.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "90d" },
  );
};


export const AdminToken = (Admin) => {
  return jwt.sign(
    {
      id: Admin._id,
      role: Admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "90d" },
  );
};
