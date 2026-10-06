import OrganizerRequestModel from "../models/OrganizerRequest.js"

export class OrganizerRequestDAO{
    async create(data){
        return OrganizerRequestModel.create(data)
    }

    async getById(id){
        return OrganizerRequestModel.findById(id)
    }

    async updateById(id, data){
        return OrganizerRequestModel.findByIdAndUpdate(id, data, {new: true})
    }

    async findPendingByUser(userId){
        return OrganizerRequestModel.findOne({ user: userId, status: "pending" })
    }

    async findByStatus(status){
        return OrganizerRequestModel.find({ status }).populate("user", "first_name last_name email").sort({ createdAt: 1 })
    }
}
