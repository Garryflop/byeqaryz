import dayjs from 'dayjs'

const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const usd = (n: number) => dollars.format(Math.round(n))

/** "9 yr 4 mo", "8 mo", "10 yr". */
export function duration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years === 0) return `${rest} mo`
  if (rest === 0) return `${years} yr`
  return `${years} yr ${rest} mo`
}

/** Calendar month that is `months` from today, e.g. "Mar 2036". */
export const monthFromNow = (months: number) => dayjs().add(months, 'month').format('MMM YYYY')
