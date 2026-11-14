import { WindowsFilled } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { siApple, siGooglecalendar } from 'simple-icons'
import { downloadIcs, googleCalendarUrl, outlookCalendarUrl } from '../lib/calendar'
import type { Reminder } from '../lib/calendar'

function BrandIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d={path} />
    </svg>
  )
}

/**
 * One logo button per calendar, so a reminder is a single tap and no text is
 * needed. Google Calendar and Outlook open with the event filled in. Apple
 * Calendar has no web link, so that button hands over a calendar file, which
 * is how Apple Calendar adds events.
 */
export function CalendarButtons({ reminder }: { reminder: Reminder }) {
  return (
    <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
      <Tooltip title="Google Calendar">
        <a
          className="icon-button"
          href={googleCalendarUrl(reminder)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Add “${reminder.title}” to Google Calendar`}
        >
          <BrandIcon path={siGooglecalendar.path} />
        </a>
      </Tooltip>
      <Tooltip title="Outlook">
        <a
          className="icon-button"
          href={outlookCalendarUrl(reminder)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Add “${reminder.title}” to Outlook`}
        >
          <WindowsFilled style={{ fontSize: 17 }} />
        </a>
      </Tooltip>
      <Tooltip title="Apple Calendar">
        <button
          type="button"
          className="icon-button"
          onClick={() => downloadIcs([reminder])}
          aria-label={`Add “${reminder.title}” to Apple Calendar`}
        >
          <BrandIcon path={siApple.path} />
        </button>
      </Tooltip>
    </span>
  )
}
