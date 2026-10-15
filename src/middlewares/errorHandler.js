import { AppError } from "../utils/AppError.js";

export const errorHandler = (err, req, res, next) => {

    if(err instanceof AppError){
        return res.status(err.statusCode).json({ status: "error", message: err.message})
    }

    if(err.type === "entity.parse.failed"){
        return res.status(400).json({ status: "error", message: "El cuerpo de la petición no es un JSON válido" })
    }

    if(err.name === "CastError"){
        return res.status(400).json({ status: "error", message: "Id inválido" })
    }

    console.error(err)

    return res.status(500).json({ status: "error", message: "Error interno del servidor" })
} 