import { EventDAO } from "../dao/event.dao.js";
import { EventRepository } from "../repositories/event.repository.js";
import { AppError } from "../utils/AppError.js";

const eventRepository = new EventRepository(new EventDAO())

export const createEvent = async(eventData, organizerId) => {
    if(new Date(eventData.date) < new Date()){
        throw new AppError("no se puede crear un evento con fecha pasada",400)
    }

    if(eventData.capacity <= 0){
        throw new AppError("error de capacidad inválida",400)
    }
    if(eventData.price < 0){
        throw new AppError("error de precio inválido",400)
    }

    const event = await eventRepository.create({...eventData, organizer : organizerId})

    return event
}

export const getEvents = async(query) => {
    let page = 1
    if(query.page){
        page = Number(query.page)
    }
    let limit = 10
    if(query.limit){
        limit = Number(query.limit)
    }

    let skip = (page - 1) * limit 
    const filter = {}
    if(query.category){
        filter.category = query.category
    }
    if(query.status){
        filter.status = query.status
    }
    else {
        filter.status = "published"
    }
    if(query.location){
        filter.location = query.location
    }

    if(query.dateFrom || query.dateTo){
        filter.date = {}

        if(query.dateFrom){
            filter.date.$gte = new Date(query.dateFrom)
        }
        if(query.dateTo){
            filter.date.$lte = new Date(query.dateTo)
        }
    }

    let sort = { date : 1 } 
    if(query.sortBy){
        sort = {}
        sort[query.sortBy] = query.order === "desc" ? -1 : 1
    }

    const events = await eventRepository.getAll(filter, skip, limit, sort)

    const total = await eventRepository.count(filter)

    const totalPages = Math.ceil(total / limit)

    return { events, page, limit, total, totalPages }
}

export const getEventById = async (id) => {
    const event = await eventRepository.getById(id)

    if(!event){
        throw new AppError("Evento no encontrado",404)
    }
    return event
}

const checkEvent = (event, user ) => {
    if(event.organizer.toString() !== user.id && user.role !== "admin"){
        throw new AppError("El usuario no tiene los permisos necesarios",403)
    }
    if(event.status === "cancelled"){
        throw new AppError("No se puede modificar un evento cancelado",400)
    }
}

export const updateEvent = async (id, data, user) => {
    const event = await getEventById(id)
    checkEvent(event, user)
    if(data.date && new Date(data.date) < new Date()){
        throw new AppError("no se puede modificar un evento con fecha pasada",400)
    }
    if(data.capacity <=  0 && data.capacity !== undefined){
        throw new AppError("Error de capacidad inválida",400)
    }
    if(data.price < 0 && data.price !== undefined){
        throw new AppError("Error de precio inválido",400)
    }

    const updatedEvent = await eventRepository.updateById(id, data)
    return updatedEvent
}

export const updateEventStatus = async (id, status, user) => {
    const event = await getEventById(id)
    checkEvent(event, user)
    const validStates = ["published", "cancelled", "draft", "finished"]
    if(!validStates.includes(status)){
        throw new AppError("estado no existente",400)
    }

    const updatedEvent = await eventRepository.updateById(id, { status })
    return updatedEvent
}

