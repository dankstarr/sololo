'use client'

interface Day {
  id: number | string
  name: string
  color?: string
}

interface DaySelectorProps {
  days: Day[]
  selectedDay: number | string | null
  onDaySelect: (dayId: number | string) => void
  className?: string
}

export default function DaySelector({
  days,
  selectedDay,
  onDaySelect,
  className = '',
}: DaySelectorProps) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-2 flex gap-2 ${className}`}>
      {days.map((day) => (
        <button
          key={day.id}
          onClick={() => onDaySelect(day.id)}
          className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
            selectedDay === day.id
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {day.name}
        </button>
      ))}
    </div>
  )
}
