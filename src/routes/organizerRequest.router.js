import { Router } from "express";
import { createRequest, listRequests, approveRequest, rejectRequest} from "../controllers/organizerRequest.controller.js"
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router()
router.post("/", authenticate, authorize(["user"]), createRequest)
router.get("/", authenticate, authorize(["admin"]), listRequests)
router.patch("/:rid/approve", authenticate, authorize(["admin"]), approveRequest)
router.patch("/:rid/reject", authenticate, authorize(["admin"]), rejectRequest)

export default router