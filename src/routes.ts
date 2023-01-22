import { FastifyInstance } from "fastify"
import { z } from "zod"
import dayjs from "dayjs"
import { prisma } from "./lib/prisma"

export async function appRoutes(app: FastifyInstance) {
  app.post("/habits", async (req) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(
        z.number().min(0).max(6)
      )
    })

    const { title, weekDays } = createHabitBody.parse(req.body)

    const today = dayjs().startOf('day').toDate()
    console.log(today)
    const habit = await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map(weekDay => ({ week_day: weekDay }))
        }
      }
    })

    return habit
  })

  app.get("/day", async (req) => {
    const getDayParams = z.object({
      date: z.coerce.date()
    })

    const { date } = getDayParams.parse(req.query)

    // todos hábitos possíveis
    const parsedDate = dayjs(date).startOf('day')
    const dayWeek = parsedDate.get('day')
    console.log(date, dayWeek)

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date
        },
        weekDays: {
          some: {
            week_day: dayWeek
          }
        }
      }
    })


    // todos os hábitos completados
    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate()
      },
      include: {
        dayHabit: true
      }
    })

    const completedHabits = day?.dayHabit.map(({ habit_id }) => habit_id) ?? []

    return {
      possibleHabits,
      completedHabits
    }
  })
}
