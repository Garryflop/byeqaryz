import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/**
 * Centred title and lead-in at the top of a screen. Focus moves to the heading
 * when the screen opens, so keyboard and screen-reader users land in the right
 * place after each step.
 */
export function ScreenIntro({ title, children }: { title: string; children?: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className="intro">
      <h1 ref={heading} tabIndex={-1}>
        {title}
      </h1>
      {children && <p>{children}</p>}
    </div>
  )
}

export interface LineItem {
  label: ReactNode
  value: ReactNode
  /** Shown in bold: a result or a total. */
  total?: boolean
}

/** A list of label and value pairs: a sum, a breakdown or a summary. */
export function Lines({ items }: { items: LineItem[] }) {
  return (
    <dl className="lines">
      {items.map((item, i) => (
        <div className={`line${item.total ? ' line--total' : ''}`} key={i}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
