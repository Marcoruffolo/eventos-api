export class OrganizerRequestRepository{
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

    async findPendingByUser(userId){
        return this.dao.findPendingByUser(userId)
    }

    async findLatestByUser(userId){
        return this.dao.findLatestByUser(userId)
    }

    async findByStatus(status){
        return this.dao.findByStatus(status)
    }

}
