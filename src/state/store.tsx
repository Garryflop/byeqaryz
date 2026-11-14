import dayjs from 'dayjs'
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { DEFAULT_BORROWER, PERSONAS } from '../data/personas'
import { PLAN_ORDER, compare } from '../engine/compare'
import type { Borrower, PlanId } from '../engine/types'

/** 0 is the intro; 1 to 6 are the six screens of the journey. */
export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6

// eslint-disable-next-line react-refresh/only-export-components
export const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Your details' },
  { step: 2, label: 'Your options' },
  { step: 3, label: 'Compare plans' },
  { step: 4, label: 'Understand your plan' },
  { step: 5, label: 'Get your action plan' },
  { step: 6, label: 'Your next steps' },
]

/** What the borrower cares about most when two plans pull in different directions. */
export type Priority = 'payment' | 'total'

export interface AppState {
  step: Step
  /** Furthest screen unlocked so far; later ones stay closed in the navigation. */
  reached: Step
  borrower: Borrower
  priority: Priority
  /** Plans ticked for comparison on the options screen. */
  selected: PlanId[]
  /** Plan the borrower is looking at in detail and, later, following. */
  focus: PlanId | null
  /** Whether the action plan has been bought (simulated in this build). */
  purchased: boolean
  /** Ids of the checklist steps marked as done. */
  checklist: string[]
  /** Months ("2026-11") in which the borrower logged a payment. */
  loggedMonths: string[]
  /** Next income recertification date, ISO string. */
  recertDate: string | null
}

export type Action =
  | { type: 'go'; step: Step }
  | { type: 'advance'; step: Step }
  | { type: 'submitDetails'; borrower: Borrower; priority: Priority }
  | { type: 'loadSample'; borrower: Borrower }
  | { type: 'patchBorrower'; patch: Partial<Borrower> }
  | { type: 'setPriority'; priority: Priority }
  | { type: 'togglePlan'; plan: PlanId }
  | { type: 'focus'; plan: PlanId }
  | { type: 'purchase' }
  | { type: 'toggleCheck'; id: string }
  | { type: 'toggleMonth'; month: string }
  | { type: 'setRecert'; date: string | null }
  | { type: 'reset' }

const STORAGE_KEY = 'byeqaryz:v1'

const eligiblePlans = (b: Borrower) => compare(b).results.map((r) => r.id)

const initialState: AppState = {
  step: 0,
  reached: 1,
  borrower: DEFAULT_BORROWER,
  priority: 'payment',
  selected: PLAN_ORDER,
  focus: null,
  purchased: false,
  checklist: [],
  loggedMonths: [],
  recertDate: null,
}

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'go':
      return action.step <= state.reached ? { ...state, step: action.step } : state
    case 'advance':
      return {
        ...state,
        step: action.step,
        reached: Math.max(state.reached, action.step) as Step,
      }
    case 'submitDetails':
    case 'loadSample': {
      // New details mean new numbers, so the later screens have to be walked again.
      const priority = action.type === 'submitDetails' ? action.priority : state.priority
      return {
        ...state,
        borrower: action.borrower,
        priority,
        selected: eligiblePlans(action.borrower),
        focus: null,
        step: 2,
        reached: 2,
      }
    }
    case 'patchBorrower':
      return { ...state, borrower: { ...state.borrower, ...action.patch } }
    case 'setPriority':
      return { ...state, priority: action.priority }
    case 'togglePlan':
      return { ...state, selected: toggle(state.selected, action.plan) }
    case 'focus':
      return { ...state, focus: action.plan, step: 4, reached: Math.max(state.reached, 4) as Step }
    case 'purchase':
      return { ...state, purchased: true, step: 6, reached: 6 }
    case 'toggleCheck':
      return { ...state, checklist: toggle(state.checklist, action.id) }
    case 'toggleMonth':
      return { ...state, loggedMonths: toggle(state.loggedMonths, action.month).sort() }
    case 'setRecert':
      return { ...state, recertDate: action.date }
    case 'reset':
      return initialState
  }
}

/**
 * A link such as `?demo=teacher&step=6` opens a sample borrower on a given
 * screen with everything before it filled in. The figures are computed live.
 */
function fromDemoLink(): AppState | null {
  const params = new URLSearchParams(window.location.search)
  const persona = PERSONAS.find((p) => p.key === params.get('demo'))
  if (!persona) return null
  const step = Math.min(6, Math.max(1, Number(params.get('step')) || 3)) as Step
  const result = compare(persona.borrower)
  const month = (back: number) => dayjs().subtract(back, 'month').format('YYYY-MM')
  return {
    ...initialState,
    step,
    reached: step,
    borrower: persona.borrower,
    selected: result.results.map((r) => r.id),
    focus: step >= 4 ? result.cheapest.id : null,
    purchased: step === 6,
    checklist: step === 6 ? ['confirm'] : [],
    loggedMonths: step === 6 ? [month(2), month(1), month(0)] : [],
    recertDate: step === 6 ? dayjs().add(41, 'day').format('YYYY-MM-DD') : null,
  }
}

/** Saved data never leaves the device: it is kept in this browser only. */
function load(): AppState {
  const demo = fromDemoLink()
  if (demo) return demo
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const saved = JSON.parse(raw) as Partial<AppState>
    return { ...initialState, ...saved, borrower: { ...DEFAULT_BORROWER, ...saved.borrower } }
  } catch {
    return initialState
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private mode or blocked storage: the app still works, it just forgets.
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

/** The comparison for the current borrower, plus the plan in focus. */
// eslint-disable-next-line react-refresh/only-export-components
export function usePlans() {
  const { state } = useStore()
  const comparison = useMemo(() => compare(state.borrower), [state.borrower])
  const best = state.priority === 'payment' ? comparison.lowestPayment : comparison.cheapest
  const focused = comparison.results.find((r) => r.id === state.focus) ?? best
  return { comparison, best, focused }
}
