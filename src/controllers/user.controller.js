import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user detials from fronted
    const { fullName, email, username , password } = req.body
    console.log("email : ", email)

    // validation - not empty 
    if ( [fullName ,email , username , password].some((fields)=> fields?.trim() === "") ) {
         return new ApiError(400 , "All fields are required")
    }
    // check if user already exitst or not : username & email unique
    const userExist = await User.findOne({
            $or : [ {email} , { username}]
    })
    if (userExist) {
        return new ApiError(409 , "User with email or username already exist")
    }
    // check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLacalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        return new ApiError(400 , "Avatar image is required")
    }
    //upload them to cloudinary , avatar
    const avatar =await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLacalPath)
    if (!avatar) {
        return new ApiError(400 , "Avatar image is required")
    }
    // create user object - create entry in db 
    const user = await User.create({
        fullName,
        email,
        username,
        password,
        avatar: avatar.url,
        coverImage : coverImage?.url || ""

    })
    // remove pswd and refresh token from response
    //check user create succesfully
    const createdUser =await User.findById(user._id).select("-password -refreshToken")
    
    if (!createdUser) {
        return new ApiError(500 , "Something went wrong while registering the user")
    }
    // return response

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered Successfully")
    )
    
})

export {registerUser }