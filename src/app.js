import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/passport.js"
import passport from "passport";
import { errorHandler } from "./middlewares/errorHandler.js";
import sessionRouter from "./routes/session.router.js"
import eventRouter from "./routes/event.router.js";
import ticketRouter from "./routes/ticket.router.js";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());


app.use(passport.initialize());


app.get("/",(req,res) =>{
    res.send("API funcionando");
});

app.use("/api/sessions",sessionRouter)
app.use("/api/events",eventRouter)
app.use("/api/tickets",ticketRouter)

app.use(errorHandler);

export default app;

