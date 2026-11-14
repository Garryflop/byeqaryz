export type TermId = 'rap' | 'ibr' | 'standard' | 'pslf' | 'save' | 'servicer'

export interface Definition {
  /** Full name of the programme. */
  name: string
  /** What it means for the borrower, in two or three plain sentences. */
  meaning: string
}

/** Plain-language explanations of the federal programmes the app talks about. */
export const GLOSSARY: Record<TermId, Definition> = {
  rap: {
    name: 'Repayment Assistance Plan (RAP)',
    meaning:
      'A federal plan that opened on July 1, 2026. You pay 1% to 10% of your income, less $50 a month per child. If that does not cover the interest, the government waives the rest, and what is left after 30 years is forgiven.',
  },
  ibr: {
    name: 'Income-Based Repayment (IBR)',
    meaning:
      'A federal plan where you pay 10% or 15% of the income you have above a protected amount, which can be as little as $0. Whatever is left after 20 or 25 years is forgiven.',
  },
  standard: {
    name: 'Standard plan',
    meaning:
      'The default federal plan. You pay the same amount every month and the loan is paid off in 10 years. The payment is the highest, but you pay the least interest.',
  },
  pslf: {
    name: 'Public Service Loan Forgiveness (PSLF)',
    meaning:
      'For people who work full-time for a government or non-profit employer, such as teachers and nurses. After 120 monthly payments the rest of the loan is forgiven, with no tax on it.',
  },
  servicer: {
    name: 'Loan servicer',
    meaning:
      'The company that collects your student loan payments for the government, such as Nelnet, MOHELA, Aidvantage or EdFinancial. You do not choose it, and you go through it to change your repayment plan.',
  },
  save: {
    name: 'SAVE plan',
    meaning:
      'An income-driven plan with very low payments that a court ended in March 2026. Borrowers who were on it have to move to another plan.',
  },
}
