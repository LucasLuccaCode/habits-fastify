import { FastifyInstance } from "fastify"
import { string, z } from "zod"
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


  // Completar / não completar um hábito
  app.patch("/habits/:habitId/toggle", async (req) => {
    const toggleHabitParams = z.object({
      habitId: z.string().uuid()
    })

    const { habitId } = toggleHabitParams.parse(req.params)

    const today = dayjs().startOf('day').toDate()

    let day = await prisma.day.findUnique({
      where: {
        date: today
      }
    })

    if (!day) {
      day = await prisma.day.create({
        data: {
          date: today
        }
      })
    }

    // Completar o hábito no dia
    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: habitId
        }
      }
    })

    if (dayHabit) {
      await prisma.dayHabit.delete({
        where: {
          id: dayHabit.id
        }
      })
    } else {
      await prisma.dayHabit.create({
        data: {
          day_id: day.id,
          habit_id: habitId
        }
      })
    }
  })
}
