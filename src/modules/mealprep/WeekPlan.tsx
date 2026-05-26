import DayCell from './DayCell'
import type { WeekPlanData, MealStatus } from './queries'

interface WeekPlanProps {
  data: WeekPlanData
  weekStart: string
  onSaveDay: (dow: number, description: string, calories: number | null, status: MealStatus) => void
}

export default function WeekPlan({ data, weekStart, onSaveDay }: WeekPlanProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
      {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
        const day = data.days.find((d) => d.day_of_week === dow)
        return (
          <DayCell
            key={`${weekStart}-${dow}`}
            dow={dow}
            day={day}
            onSave={onSaveDay}
          />
        )
      })}
    </div>
  )
}
