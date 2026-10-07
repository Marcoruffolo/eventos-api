export const organizerRequestDTO = (organizerRequest) => {
    return{
        id: organizerRequest._id,
        user: organizerRequest.user,
        organizationName: organizerRequest.organizationName,
        description: organizerRequest.description,
        website: organizerRequest.website,
        status: organizerRequest.status,
        reviewedBy: organizerRequest.reviewedBy,
        reviewedAt: organizerRequest.reviewedAt,
        createdAt: organizerRequest.createdAt
    }
}