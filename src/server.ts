import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import Fastify from 'fastify'

const app = Fastify()
const prisma = new PrismaClient()
const PORT = 3000

app.register(cors, {
  origin: 'http://localhost:5173'
})

app.get("/", async () => {
  const habits = await prisma.habit.findMany()
  return habits
})

app.listen({
  port: PORT
}).then(() => console.log("Server listening on port ", PORT))