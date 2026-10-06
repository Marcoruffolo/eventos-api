import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    organizationName: {type: String, required: true},
    description: {type: String, required: true},
    website: {type: String},
    status: {type: String, enum: ["pending","approved","rejected"], default: "pending"},
    reviewedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
    reviewedAt: {type: Date, default: null},
    createdAt: {type: Date, default: Date.now},
})

const OrganizerRequest = mongoose.model("OrganizerRequest", requestSchema)

export default OrganizerRequest;
