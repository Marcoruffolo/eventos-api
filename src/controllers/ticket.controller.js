import { createTicket as createTicketService, getMyTickets, getEventTickets, cancelTicket as cancelTicketService } from "../services/ticket.service.js";
import { TicketDTO } from "../dto/ticket.dto.js";

export const createTicket = async(req, res) => {
    const ticket = await createTicketService(req.params.eid, req.user, req.body?.quantity)
    res.status(201).json({ status: "success", data: TicketDTO(ticket) })
}

export const myTickets = async(req, res) => {
    const tickets = await getMyTickets(req.user.id)
    res.status(200).json({ status: "success", data: tickets.map(ticket => TicketDTO(ticket)) })
}

export const eventTickets = async(req, res) => {
    const tickets = await getEventTickets(req.params.eid, req.user)
    res.status(200).json({ status: "success", data: tickets.map(ticket => TicketDTO(ticket)) })
}

export const cancelTicket = async(req, res) => {
    const ticket = await cancelTicketService(req.params.tid, req.user)
    res.status(200).json({ status: "success", data: TicketDTO(ticket) })
}
