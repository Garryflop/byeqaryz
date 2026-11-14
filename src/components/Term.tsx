import { Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { GLOSSARY } from '../data/glossary'
import type { TermId } from '../data/glossary'

/**
 * A piece of loan jargon with its explanation on hover, tap or keyboard focus.
 * The dotted underline tells the reader there is something to read.
 */
export function Term({ id, children }: { id: TermId; children: ReactNode }) {
  const { name, meaning } = GLOSSARY[id]

  return (
    <Tooltip
      trigger={['hover', 'focus', 'click']}
      title={
        <>
          <strong>{name}</strong>
          <br />
          {meaning}
        </>
      }
      styles={{ root: { maxWidth: 320 } }}
    >
      <span className="term" tabIndex={0}>
        {children}
      </span>
    </Tooltip>
  )
}
