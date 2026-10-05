import connectDB, { disconnectDB } from "../config/db.js";
import { ensureAdmin } from "../services/user.service.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
    console.error("faltan ADMIN_EMAIL o ADMIN_PASSWORD en el .env");
    process.exit(1);
}

await connectDB();

try {
    const user = await ensureAdmin({ email, password });
    console.log(user.email, user.role);
} catch(error) {
    console.error(error.message);
    process.exitCode = 1
} finally {
    await disconnectDB();
}
