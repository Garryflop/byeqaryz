# ByeQaryz

Compare US federal student loan repayment plans, see how every number is
calculated, and get a plan you can act on.

The repayment rules changed in 2026: the SAVE plan ended and the Repayment
Assistance Plan (RAP) opened on July 1. ByeQaryz shows a borrower what each
plan open to them costs, explains the arithmetic, and turns the choice into a
checklist, a script for their loan servicer and deadlines in their calendar.

Track: Money. User: working adults aged 25 to 45 in the US with federal student
debt. Built by team SWAGA for Business Cup 2.0.

## The journey

| Step | Screen | What happens | Price |
|---|---|---|---|
| 0 | Intro | "Know your options. Pay with a plan." Start, or open a sample borrower | Free |
| 1 | Your details | Debt, household, priority: three short stages | Free |
| 2 | Your options | The federal plans open to you, and why the others are closed | Free |
| 3 | Compare plans | Payment, total cost, end date and forgiveness, side by side | Free |
| 4 | Understand your plan | The payment broken down line by line, and what can change it | Free |
| 5 | Get your action plan | What is included, and a demo checkout | $29, one time |
| 6 | Your next steps | Checklist, what-if scenarios, servicer scripts, calendar and payment count | Included |

The repayment plans (Standard, IBR, RAP) are federal programmes: the borrower
pays their loan servicer. What we sell is the action plan.

## For the jury

- No sign-up or login. Everything runs in the browser.
- **Sample data:** the intro has four sample borrowers. They go through the same
  engine as typed input, and every field can be edited.
- **Checkout is in demo mode.** A test card is filled in, nothing is charged and
  no email is sent. Tick the box and press "Simulate $29 purchase".
- **Return mechanic:** the checklist and the monthly payment count are saved in
  the browser, and deadlines go to Google Calendar or a calendar file.
- **Direct links:** `/?demo=family&step=3` opens a sample borrower on a given
  screen (`demo`: `teacher`, `family`, `starter`, `earner`; `step`: 1 to 6;
  on step 6, `tab`: `checklist`, `whatif`, `script`, `calendar`).

## How it works

- **No AI and no backend.** A deterministic engine computes every figure in the
  browser. Nothing the user types is uploaded.
- **State** is kept in `localStorage` on the user's device.
- **Stack:** React, TypeScript, Vite, Ant Design, Recharts, Day.js,
  simple-icons (calendar logos), Vitest.

## Project layout

| Path | What it holds |
|---|---|
| `src/engine/rules.ts` | Every number that comes from law or regulation, with its source |
| `src/engine/simulate.ts` | Month-by-month simulation of Standard, IBR and RAP |
| `src/engine/compare.ts` | Eligibility, the comparison and the cost of doing nothing |
| `src/engine/explain.ts` | The step-by-step arithmetic shown under each payment |
| `src/engine/engine.test.ts` | Tests, including reference figures from the official calculator |
| `src/screens/` | The intro and the six screens |
| `src/components/` | Shared pieces: chart, glossary tooltips, calendar buttons, FAQ |
| `src/state/store.tsx` | App state, step navigation and demo links |
| `src/data/` | Sample borrowers, glossary and servicer script templates |

## Accuracy

The engine is tested against figures read from the official
[Repayment Calculator](https://studentaid.gov/repayment-calculator/) on
2026-11-14. Standard, Tiered Standard and RAP totals match to within 0.05%;
IBR totals and forgiven amounts match to within 1% (the official tool projects
poverty guidelines with CBO inflation forecasts; we use a flat 2.4% a year).

Not modelled: a spouse's own federal loans, the Graduated and Extended plans,
and state income tax. Parent PLUS borrowers are shown the Standard plan only.

## Run it

```bash
npm install
npm run dev     # local development
npm test        # engine tests
npm run build   # production build in dist/
```

ByeQaryz gives estimates from published federal rules. It is not affiliated
with the U.S. Department of Education and is not financial advice.
