import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearTestDB, closeTestDB } from "../setup/db.js";


beforeAll(async () => {
    await connectTestDB()
})

afterEach(async() => {
    await clearTestDB()
})

afterAll(async() => {
    await closeTestDB()
})

test("un usuario puede registrarse, loguearse y consultar su sesión actual", async () => {
    const agent = request.agent(app)
    const res1 = await agent.post("/api/sessions/register")
    .send({ first_name : "Juan", last_name : "perez", email : "juanperez@gmail.com", password : "Segura123" })
    expect(res1.status).toBe(201)

    const res2 = await agent.post("/api/sessions/login")
    .send({ email : "juanperez@gmail.com", password : "Segura123"})
    expect(res2.status).toBe(200)

    const res3 = await agent.get("/api/sessions/current")
    expect(res3.status).toBe(200)
    expect(res3.body.payload.email).toBe("juanperez@gmail.com")
})

test("login con credenciales invalidas", async () => {
    const resRegister = await request(app).post("/api/sessions/register")
    .send({ first_name : "Juan", last_name : "perez", email : "juanperez@gmail.com", password : "Segura123" })
    expect(resRegister.status).toBe(201)

    const resLogin = await request(app).post("/api/sessions/login")
    .send({ first_name : "Juan", last_name : "perez", email : "juanperez@gmail.com", password : "Otra12345" })
    expect(resLogin.status).toBe(401)
})

test("registro con contraseña insegura devuelve 400", async () => {
    const res = await request(app).post("/api/sessions/register")
    .send({ first_name : "Juan", last_name : "perez", email : "juanperez@gmail.com", password : "3535" })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch("La contraseña debe tener")
})
