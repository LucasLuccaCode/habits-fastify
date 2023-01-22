import cors from '@fastify/cors'
import Fastify from 'fastify'
import { appRoutes } from './routes'

const app = Fastify()
const PORT = 3000

app.register(cors, {
  origin: 'http://localhost:5173'
})

app.register(appRoutes)

app.listen({
  port: PORT
}).then(() => console.log("Server listening on port ", PORT))