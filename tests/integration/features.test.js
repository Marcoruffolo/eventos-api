import request from "supertest";
import app from "../../src/app.js";
import UserModel from "../../src/models/User.js";
import { connectTestDB, clearTestDB, closeTestDB } from "../setup/db.js";

beforeAll(async () => {
    await connectTestDB()
})

afterEach(async () => {
    await clearTestDB()
})

afterAll(async () => {
    await closeTestDB()
})

const loginAs = async (email, role = "user") => {
    const agent = request.agent(app)
    await agent.post("/api/sessions/register")
    .send({ first_name: "Test", last_name: "User", email, password: "Segura123" })
    if (role !== "user") {
        await UserModel.updateOne({ email }, { role })
    }
    await agent.post("/api/sessions/login").send({ email, password: "Segura123" })
    return agent
}

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

const eventData = (overrides = {}) => ({
    title: "Evento de prueba",
    description: "Descripción",
    category: "Tech",
    date: futureDate,
    location: "Buenos Aires",
    capacity: 10,
    price: 0,
    ...overrides
})

test("JSON malformado devuelve 400 en vez de 500", async () => {
    const res = await request(app)
    .post("/api/sessions/login")
    .set("Content-Type", "application/json")
    .send('{"email": "a@a.com", "password": ')
    expect(res.status).toBe(400)
})

test("GET /events/mine requiere estar logueado y ser organizer o admin", async () => {
    const anon = await request(app).get("/api/events/mine")
    expect(anon.status).toBe(401)

    const user = await loginAs("user@test.com")
    const res = await user.get("/api/events/mine")
    expect(res.status).toBe(403)
})

test("el organizer ve sus borradores en /events/mine pero no los de otro", async () => {
    const organizer = await loginAs("org@test.com", "organizer")
    const other = await loginAs("otro@test.com", "organizer")

    await organizer.post("/api/events").send(eventData({ title: "Mi borrador" }))
    await other.post("/api/events").send(eventData({ title: "Ajeno" }))

    const res = await organizer.get("/api/events/mine")
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toBe("Mi borrador")
    expect(res.body.data[0].status).toBe("draft")

    const publicList = await request(app).get("/api/events")
    expect(publicList.body.data).toHaveLength(0)
})

test("el filtro de ubicación no distingue mayúsculas y acepta texto parcial", async () => {
    const organizer = await loginAs("org@test.com", "organizer")
    const created = await organizer.post("/api/events").send(eventData({ location: "Teatro Colón, CABA" }))
    await organizer.patch(`/api/events/${created.body.data.id}/status`).send({ status: "published" })

    const res = await request(app).get("/api/events?location=colón")
    expect(res.body.data).toHaveLength(1)

    const none = await request(app).get("/api/events?location=rosario")
    expect(none.body.data).toHaveLength(0)
})

test("page y limit inválidos no rompen el listado", async () => {
    const res = await request(app).get("/api/events?page=abc&limit=-5")
    expect(res.status).toBe(200)
    expect(res.body.page).toBe(1)
    expect(res.body.limit).toBe(1)
})

test("GET /organizer-requests/me devuelve null sin solicitudes y la última si existe", async () => {
    const user = await loginAs("user@test.com")

    const empty = await user.get("/api/organizer-requests/me")
    expect(empty.status).toBe(200)
    expect(empty.body.data).toBeNull()

    await user.post("/api/organizer-requests").send({ organizationName: "Org", description: "Recitales" })

    const res = await user.get("/api/organizer-requests/me")
    expect(res.body.data.status).toBe("pending")
    expect(res.body.data.organizationName).toBe("Org")
})
