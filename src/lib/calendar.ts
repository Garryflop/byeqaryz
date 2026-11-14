import dayjs from 'dayjs'
import { saveFile } from './download'

export interface Reminder {
  /** ISO date (YYYY-MM-DD) of the all-day event. */
  date: string
  title: string
  description: string
}

/**
 * Link that opens Google Calendar with the event already filled in. The
 * borrower only has to press Save, and we never need access to their account.
 */
export function googleCalendarUrl(r: Reminder): string {
  const day = dayjs(r.date)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: r.title,
    dates: `${day.format('YYYYMMDD')}/${day.add(1, 'day').format('YYYYMMDD')}`,
    details: r.description,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Link that opens Outlook on the web with the event already filled in. */
export function outlookCalendarUrl(r: Reminder): string {
  const day = dayjs(r.date)
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    allday: 'true',
    subject: r.title,
    startdt: day.format('YYYY-MM-DD'),
    enddt: day.add(1, 'day').format('YYYY-MM-DD'),
    body: r.description,
  })
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}

const escapeText = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

/** iCalendar file for Apple Calendar, Outlook and anything else. */
export function buildIcs(reminders: Reminder[]): string {
  const stamp = dayjs().format('YYYYMMDD[T]HHmmss')
  const events = reminders.map((r, i) => {
    const day = dayjs(r.date)
    return [
      'BEGIN:VEVENT',
      `UID:${stamp}-${i}@byeqaryz`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day.format('YYYYMMDD')}`,
      `DTEND;VALUE=DATE:${day.add(1, 'day').format('YYYYMMDD')}`,
      `SUMMARY:${escapeText(r.title)}`,
      `DESCRIPTION:${escapeText(r.description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(r.title)}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n')
  })
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ByeQaryz//EN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export const downloadIcs = (reminders: Reminder[], filename = 'loan-deadlines.ics') =>
  saveFile(filename, buildIcs(reminders), 'text/calendar')
