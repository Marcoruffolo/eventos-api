import { OrganizerRequestDAO } from "../dao/organizerRequest.dao.js"
import { OrganizerRequestRepository } from "../repositories/organizerRequest.repository.js"
import { promoteToOrganizer } from "./user.service.js"
import { AppError } from "../utils/AppError.js"

const organizerRequestRepository = new OrganizerRequestRepository(new OrganizerRequestDAO())

export const createOrganizerRequest = async (user, { organizationName, description, website }) =>{

    if(!organizationName || !description ){
        throw new AppError("Faltan datos obligatorios",400)
    }

    const existingOrganization = await organizerRequestRepository.findPendingByUser(user.id)

    if(existingOrganization){
        throw new AppError("ya tienes una solicitud  pendiente", 409)
    }

    const organizationRequest = await organizerRequestRepository.create({
        user: user.id,
        organizationName,
        description,
        website
    })
    
    return organizationRequest
}

export const getRequestsByStatus = async(status = "pending") => {

    const validStatus = ["pending","approved","rejected"]

    if(!validStatus.includes(status)){
        throw new AppError("Estado invalido",400)
    }

    return organizerRequestRepository.findByStatus(status)
}

export const reviewRequest = async(requestId, admin, decision) =>{
    const request = await organizerRequestRepository.getById(requestId)

    if(!request){
        throw new AppError("solicitud no encontrada",404)
    }

    if(request.status !== "pending"){
        throw new AppError("la solicitud ya fue resuelta",409)
    }

    if(decision === "approved"){
        await promoteToOrganizer(request.user)        
    }

    const updatedRequest = await organizerRequestRepository.updateById(requestId,{ status: decision, reviewedBy: admin.id, reviewedAt: new Date()})

    return updatedRequest
}
