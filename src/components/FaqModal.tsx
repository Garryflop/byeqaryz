import { Collapse, Modal } from 'antd'
import { BRAND, PLAN_PRICE } from '../brand'

const FAQ = [
  {
    q: 'What does the comparison show?',
    a: 'The federal repayment plans open to you, side by side: the payment to start, what you pay in total, when it ends and how much is forgiven. The plans are the government’s, not ours. You pay your loan servicer under whichever you choose.',
  },
  {
    q: 'What does it cost?',
    a: `Comparing plans and seeing how each payment is calculated is free. The personal action plan is a one-time purchase of $${PLAN_PRICE}. There is no subscription. In this build checkout is in demo mode and nothing is charged.`,
  },
  {
    q: 'What happens to my data?',
    a: 'Nothing leaves your device. There is no account and no bank link, and the calculation runs in your browser.',
  },
  {
    q: 'How accurate are the numbers?',
    a: 'They are calculated from the published federal rules and tested against the official Repayment Calculator on studentaid.gov: Standard and RAP totals match to the dollar, IBR within one percent. They are still estimates. Your servicer sets the final amount.',
  },
  {
    q: 'What is in the action plan?',
    a: 'A checklist for switching plans, what-if scenarios, the cost of waiting, scripts for your loan servicer, a file you can download and your deadlines for your calendar.',
  },
  {
    q: 'How does the calendar work?',
    a: 'Each deadline has two buttons. One opens Google Calendar with the reminder filled in; the other downloads a calendar file for Apple Calendar or Outlook. We never connect to your calendar account.',
  },
  {
    q: 'Is my progress saved?',
    a: 'Yes, in this browser. Come back on the same device and your answers, checklist and payment count are still there. You can also save a backup file from your plan.',
  },
  {
    q: 'How do I get help?',
    a: `${BRAND} has no live support yet. For questions about your account, payment or eligibility, contact your loan servicer. This tool is not financial advice.`,
  },
]

/** Questions and answers, reachable from every screen without losing your place. */
export function FaqModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Questions and answers"
      width={640}
      styles={{ body: { maxHeight: '70dvh', overflowY: 'auto' } }}
    >
      <Collapse
        accordion
        ghost
        expandIconPlacement="end"
        defaultActiveKey="0"
        items={FAQ.map((f, i) => ({
          key: String(i),
          label: <strong>{f.q}</strong>,
          children: <p className="muted">{f.a}</p>,
        }))}
      />
    </Modal>
  )
}
