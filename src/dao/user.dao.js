import UserModel from "../models/User.js";

export class UserDAO{
    async create(data){
        return UserModel.create(data)
    }

    async getByEmail(email){
        return UserModel.findOne({ email })
    }

    async getById(id){
        return UserModel.findById(id)
    }

    async updateRole(id, role){
        return UserModel.findByIdAndUpdate(id, { role }, {new: true})
    }
}