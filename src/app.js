import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN
}))
app.use(express.json({ limit: "16KB" }))
app.use(express.urlencoded({ extended: true, limit: "16KB" }))
app.use(express.static("public"))
app.use(cookieParser())


// route import

import userRouter from "./routes/user.routes.js";

//route declaration
app.use("/api/v1/users" , userRouter)

// http://localhost:8000/api/v1/users/register


export { app }