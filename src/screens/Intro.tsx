import { Button } from 'antd'
import { PERSONAS } from '../data/personas'
import { useStore } from '../state/store'

const BLOCKS = [
  {
    art: 'compare',
    title: 'Compare',
    text: 'Every federal repayment plan open to you, side by side: payment, total cost, end date.',
  },
  {
    art: 'maths',
    title: 'See the maths',
    text: 'Each payment is broken down line by line, from the published rules.',
  },
  {
    art: 'scenarios',
    title: 'Test scenarios',
    text: 'A raise, an extra $100 a month, filing separately: see what each one changes.',
  },
  {
    art: 'act',
    title: 'Act on it',
    text: 'A checklist, a script for your loan servicer and deadlines in your calendar.',
  },
]

export function Intro() {
  const { dispatch } = useStore()

  return (
    <>
      <section className="hero">
        <h1>Know your options. Pay with a plan.</h1>
        <p>
          Student loan rules changed in 2026. See what each federal repayment plan would cost you,
          and what to do next.
        </p>
        <Button type="primary" size="large" onClick={() => dispatch({ type: 'advance', step: 1 })}>
          Compare my plans for free
        </Button>
        <span className="muted small">No sign-up. No bank link. About a minute.</span>
      </section>

      <section className="blocks" aria-label="What you get">
        {BLOCKS.map((b) => (
          <div className="block" key={b.title}>
            {/* Decorative: the title and text carry the meaning. */}
            <img
              src={`/art/${b.art}.webp`}
              alt=""
              aria-hidden
              draggable={false}
              loading="lazy"
              decoding="async"
            />
            <h3>{b.title}</h3>
            <p className="muted">{b.text}</p>
          </div>
        ))}
      </section>

      <section className="samples" aria-label="Sample borrowers">
        <div className="samples-inner">
          <strong>No loans of your own? Open sample data:</strong>
          {PERSONAS.map((p) => (
            <Button
              key={p.key}
              onClick={() => dispatch({ type: 'loadSample', borrower: p.borrower })}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </section>
    </>
  )
}
