import EventModel from "../models/Event.js";

export class EventDAO{
    async create(data){
        return EventModel.create(data)
    }

    async getById(id){
        return EventModel.findById(id)
    }

    async updateById(id, data){
        return EventModel.findByIdAndUpdate(id, data, {new: true})
    }

    async getAll(filter, skip, limit, sort){
        return EventModel.find(filter).skip(skip).limit(limit).sort(sort)
    }

    async count(filter){
        return EventModel.countDocuments(filter)
    }

    async findByOrganizer(organizerId){
        return EventModel.find({ organizer: organizerId }).sort({ date: 1 })
    }
}