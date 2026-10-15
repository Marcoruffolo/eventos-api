export class EventRepository{
    constructor(dao){
        this.dao = dao
    }

    async create(data){
        return this.dao.create(data)
    }

    async getById(id){
        return this.dao.getById(id)
    }

    async updateById(id, data){
        return this.dao.updateById(id, data)
    }

    async getAll(filter, skip, limit, sort){
        return this.dao.getAll(filter, skip, limit, sort)
    }

    async count(filter){
        return this.dao.count(filter)
    }

    async findByOrganizer(organizerId){
        return this.dao.findByOrganizer(organizerId)
    }
}