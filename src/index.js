// require('dotenv').config({path : './env'})
import connectDB from "./db/index.js";
import app from "./app.js"
import dotenv from "dotenv";
dotenv.config({
    path : './.env'
})



connectDB().
    then(() => {
        app.on("error", (error) => {
                        console.log("ERROR :", error);
                        throw error
                    })
                    app.listen(process.env.PORT, () => {
                        console.log(`App is listening on port : ${process.env.PORT}`);
                    })
    }).
    catch((err) => {
        console.log(`MONGO DB connection failed !!: ${err}`)
    })




// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

// import express from "express";
// const app = express()
// ; (async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.log("ERROR :", error);
//             throw error
//         })
//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port : ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log("ERROR :", error)
//         throw error
        
//     }
// })()