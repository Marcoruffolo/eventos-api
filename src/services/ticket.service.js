import { TicketDAO } from "../dao/ticket.dao.js";
import { TicketRepository } from "../repositories/ticket.repository.js";
import { AppError } from "../utils/AppError.js";
import { getEventById } from "./event.service.js";
import { generateReservationCode } from "../utils/generateReservationCode.js";
import { sendTicketConfirmationEmail } from "../utils/mailer.js";

const ticketRepository = new TicketRepository(new TicketDAO())

export const createTicket = async (eventId, user, quantity = 1) => {
    const event = await getEventById(eventId)

    if(event.status !== "published"){
        throw new AppError("El evento no está publicado", 400)
    }

    const existingTicket = await ticketRepository.findActiveByUserAndEvent(user.id, eventId)
    if(existingTicket){
        throw new AppError("Ya tenés una inscripción activa a este evento", 409)
    }

    const activeTickets = await ticketRepository.findActiveByEvent(eventId)
    const occupied = activeTickets.reduce((total, ticket) => total + ticket.quantity, 0)
    if(occupied + quantity > event.capacity){
        throw new AppError("No hay cupo suficiente", 409)
    }

    const reservationCode = generateReservationCode()

    const ticket = await ticketRepository.create({
        event: eventId,
        user: user.id,
        quantity,
        reservationCode
    })

    sendTicketConfirmationEmail(user.email, event, ticket)
    .catch((error) => console.error("No se pudo enviar el email de confirmación:", error.message))

    return ticket
}

export const getMyTickets = async (userId) => {
    return ticketRepository.findByUser(userId)
}

export const getEventTickets = async (eventId, user) => {
    const event = await getEventById(eventId)

    if(event.organizer.toString() !== user.id && user.role !== "admin"){
        throw new AppError("El usuario no tiene los permisos necesarios", 403)
    }

    return ticketRepository.findByEvent(eventId)
}

export const cancelTicket = async (ticketId, user) => {
    const ticket = await ticketRepository.getById(ticketId)

    if(!ticket){
        throw new AppError("Ticket no encontrado", 404)
    }

    if(ticket.user.toString() !== user.id && user.role !== "admin"){
        throw new AppError("El usuario no tiene los permisos necesarios", 403)
    }

    if(ticket.status === "cancelled"){
        throw new AppError("El ticket ya está cancelado", 400)
    }

    const updatedTicket = await ticketRepository.updateById(ticketId, { status: "cancelled", cancelledAt: new Date() })
    return updatedTicket
}
