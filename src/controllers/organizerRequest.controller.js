import { createOrganizerRequest, getRequestsByStatus, reviewRequest } from ".././services/organizerRequest.service.js"
import { organizerRequestDTO } from "../dto/organizerRequest.dto.js";

export const createRequest = async(req, res) => {
    const request = await createOrganizerRequest(req.user, req.body ?? {})
    res.status(201).json({ status: "success", data : organizerRequestDTO(request)})
}

export const listRequests = async(req, res) => {
    const requestsStatus = await getRequestsByStatus(req.query.status)
    const status = requestsStatus.map(request => organizerRequestDTO(request))
    res.status(200).json({ status: "success", data: status})
}

export const approveRequest = async(req, res) => {
    const request = await reviewRequest(req.params.rid, req.user, "approved")
    res.status(200).json({ status: "success", data : organizerRequestDTO(request)})
}

export const rejectRequest = async(req, res) => {
    const request = await reviewRequest(req.params.rid, req.user, "rejected")
    res.status(200).json({ status: "success", data: organizerRequestDTO(request)})
}