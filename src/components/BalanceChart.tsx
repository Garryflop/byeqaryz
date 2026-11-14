import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PLAN_NAMES } from '../engine/compare'
import type { PlanId, PlanResult } from '../engine/types'
import { usd } from '../lib/format'

export interface Series {
  key: string
  label: string
  result: PlanResult
  stroke: string
  /** SVG dash pattern; solid when left out. */
  dash?: string
}

/**
 * The palette is monochrome, so each plan is told apart by its line pattern as
 * well as its shade. A plan keeps its pattern whatever else is on the chart.
 */
const PLAN_LINE: Record<PlanId, { stroke: string; dash?: string }> = {
  ibr: { stroke: '#1d1d1f' },
  rap: { stroke: '#515154', dash: '7 5' },
  standard: { stroke: '#86868b', dash: '2 4' },
}

/** One line per plan, for the comparison screen. */
// eslint-disable-next-line react-refresh/only-export-components
export const planSeries = (results: PlanResult[]): Series[] =>
  results.map((result) => ({
    key: result.id,
    label: PLAN_NAMES[result.id],
    result,
    ...PLAN_LINE[result.id],
  }))

/**
 * The same plan before and after the borrower's what-if changes. Until
 * something is changed there is only one line to draw.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function beforeAfterSeries(
  before: PlanResult,
  after: PlanResult,
  changed: boolean,
): Series[] {
  if (!changed) return [{ key: 'now', label: 'Your balance', result: after, stroke: '#1d1d1f' }]
  return [
    { key: 'after', label: 'With your changes', result: after, stroke: '#1d1d1f' },
    { key: 'before', label: 'Before', result: before, stroke: '#86868b', dash: '6 5' },
  ]
}

const INK = '#6e6e73'
const GRID = '#e8e8ed'

function toRows(series: Series[]) {
  const lastYear = Math.ceil(Math.max(...series.map((s) => s.result.months)) / 12)
  return Array.from({ length: lastYear + 1 }, (_, year) => {
    const row: Record<string, number> = { year }
    for (const { key, result } of series) {
      const point = result.timeline.find((p) => p.year === year)
      // After a plan ends the balance stays at zero.
      row[key] = point ? point.balance : year * 12 >= result.months ? 0 : result.timeline[0].balance
    }
    return row
  })
}

/** Balance still owed, year by year, one line per series. */
export function BalanceChart({ series }: { series: Series[] }) {
  const rows = toRows(series)
  const label = (key: unknown) => series.find((s) => s.key === key)?.label ?? String(key)

  return (
    <div
      role="img"
      aria-label={`Line chart of the balance still owed, year by year: ${series.map((s) => s.label).join(', ')}`}
      style={{ width: '100%', height: 280 }}
    >
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: INK, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            tickFormatter={(y: number) => (y === 0 ? 'Today' : `Yr ${y}`)}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: INK, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
          />
          <Tooltip
            formatter={(value, name) => [usd(Number(value)), label(name)]}
            labelFormatter={(y) => (Number(y) === 0 ? 'Today' : `After ${y} years`)}
            cursor={{ stroke: INK, strokeDasharray: '3 3' }}
          />
          <Legend formatter={(value) => <span style={{ color: INK }}>{label(value)}</span>} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.stroke}
              strokeDasharray={s.dash}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
