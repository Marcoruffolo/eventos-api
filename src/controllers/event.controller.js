import { createEvent as createEventService, getEventById, getEvents, updateEvent as updateEventService, updateEventStatus as updateEventStatusService } from "../services/event.service.js";
import { EventDTO } from "../dto/event.dto.js";

export const createEvent = async(req, res) => {
    const event = await createEventService(req.body, req.user.id)
    res.status(201).json({ status: "success", payload : EventDTO(event)})
}

export const eventList = async(req, res) => {
    const { events, page, limit, total, totalPages } = await getEvents(req.query)
    const desiredEvents = events.map(event => EventDTO(event))
    res.status(200).json({ status: "success", data: desiredEvents, page, limit, total, totalPages })
}

export const getEvent = async(req, res) => {
    const event = await getEventById(req.params.id)
    res.status(200).json({ status: "success", data: EventDTO(event) })
}

export const updateEvent = async(req, res) => {
    const event = await updateEventService(req.params.id, req.body, req.user)
    res.status(200).json({ status: "success", data: EventDTO(event) })
}

export const updateEventStatus = async(req, res) => {
    const event = await updateEventStatusService(req.params.id, req.body.status, req.user)
    res.status(200).json({ status: "success", data: EventDTO(event)})
}