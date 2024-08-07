import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generaterRefreshToken()
        console.log("refresh token ", refreshToken)
        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // get user detials from fronted
    const { fullName, email, username, password } = req.body
    console.log("email : ", email)

    // validation - not empty 
    if ([fullName, email, username, password].some((fields) => fields?.trim() === "")) {
        return new ApiError(400, "All fields are required")
    }
    // check if user already exitst or not : username & email unique
    const userExist = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (userExist) {
        return new ApiError(409, "User with email or username already exist")
    }
    // check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLacalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLacalPath = req.files?.coverImage[0]?.path;
    }


    if (!avatarLocalPath) {
        return new ApiError(400, "Avatar image is required")
    }
    //upload them to cloudinary , avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLacalPath)
    if (!avatar) {
        return new ApiError(400, "Avatar image is required")
    }
    // create user object - create entry in db 
    const user = await User.create({
        fullName,
        email,
        username,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""

    })
    // remove pswd and refresh token from response
    //check user create succesfully
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        return new ApiError(500, "Something went wrong while registering the user")
    }
    // return response

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})
const loginUser = asyncHandler(async (req, res) => {

    // get user details from fronted
    const { email, username, password } = req.body

    // validation not empty
    if (!(email || username)) {
        throw new ApiError(400, "email or username is required")
    }

    // check if user already exitst or not : username & email unique

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })


    if (!user) {
        throw new ApiError(409, "User does not exist");
    }
    // check password is correct
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect")
    }
    //generate access token and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user?._id)

    // send cookies
    const loggedInUser = await User.findById(user._id).select("-password -refeshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    console.log("loggedIn user ", loggedInUser)
    return res.status(200).
        cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200, {
                user: accessToken, refreshToken, loggedInUser
            },
                "User login successfully"
            )
        )



})
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }

    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {},
        "User logout  successfully"
    ))
})

const refreshAccessToken = asyncHandler(
    async (req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request")
        }
        try {
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
            const user = await User.findById(decodedToken?._id)
            if (!user) {
                throw new ApiError(401, "invalid refresh token")

            }
            if (incomingRefreshToken !== user?.refreshToken) {
                throw new ApiError(401, "Refresh token is expired or used")
            }
            const options = {
                httpOnly: true,
                secure: true
            }
            const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user?._id)
            return res.status(200).
                cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newReRreshToken, options).json(
                    new ApiResponse(200, {
                        accessToken, refreshToken: newRefreshToken
                    },
                        "Access Token Refreshed "
                    )
                )

        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }

    }
)
export { registerUser, loginUser, logoutUser, refreshAccessToken }