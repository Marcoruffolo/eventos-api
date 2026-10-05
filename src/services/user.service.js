import { UserDAO } from "../dao/user.dao.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createHash, isValidPassword } from "../utils/hashing.js";
import { AppError } from "../utils/AppError.js";
import { getPasswordErrors } from "../utils/passwordPolicy.js";

const userRepository = new UserRepository(new UserDAO())

export const registerUser = async ({ first_name, last_name, email, password}) => {
    const passwordErrors = getPasswordErrors(password)
    if(passwordErrors.length > 0){
        throw new AppError(`La contraseña debe tener ${passwordErrors.join(", ")}`, 400)
    }

    const existingUser = await userRepository.getByEmail(email)
    if(existingUser){
        throw new AppError("Ya existe un usuario con ese email",409)
    }
    const hashedPassword = await createHash(password)

    const user = await userRepository.create({ first_name, last_name, email, password: hashedPassword, role: "user"})

    return user;
}

export const loginUser = async(email,password) => {
    const existingUser = await userRepository.getByEmail(email)

    if(!existingUser){
        throw new AppError("Credenciales invalidas",401)
    }

    const checkPassword = await isValidPassword(password,existingUser.password)

    if(!checkPassword){
        throw new AppError("Credenciales invalidas",401)
    }

    return existingUser;
}

export const getUserById = async (id) => {
    return userRepository.getById(id)
}