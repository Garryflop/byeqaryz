import { Button, Form, InputNumber, Segmented, Select, Steps } from 'antd'
import { useState } from 'react'
import { Term } from '../components/Term'
import { ScreenIntro } from '../components/ui'
import { STATES } from '../engine/rules'
import type { Borrower } from '../engine/types'
import { useStore } from '../state/store'
import type { Priority } from '../state/store'

type FormValues = Borrower & { priority: Priority }

const dollars = {
  prefix: '$',
  min: 0,
  controls: false,
  style: { width: '100%' },
  size: 'large' as const,
  formatter: (v?: number | string) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  parser: (v?: string) => Number((v ?? '').replace(/[^\d.]/g, '')),
}

const YES_NO = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
]

/** The three short stages of the questionnaire and the fields each one checks. */
const STAGES: { title: string; fields: (keyof FormValues)[] }[] = [
  {
    title: 'Your debt',
    fields: [
      'balance',
      'rate',
      'currentPlan',
      'loanType',
      'newLoansSinceJuly2026',
      'borrowedBeforeJuly2014',
    ],
  },
  {
    title: 'Your household',
    fields: ['agi', 'state', 'familySize', 'dependents', 'filing', 'spouseAgi'],
  },
  { title: 'Your priority', fields: ['priority', 'pslf', 'qualifyingPayments'] },
]

export function Details() {
  const { state, dispatch } = useStore()
  const [form] = Form.useForm<FormValues>()
  const [stage, setStage] = useState(0)
  const filing = Form.useWatch('filing', form)
  const pslf = Form.useWatch('pslf', form)
  const last = stage === STAGES.length - 1

  async function next() {
    try {
      await form.validateFields(STAGES[stage].fields)
    } catch {
      return
    }
    if (!last) {
      setStage(stage + 1)
      return
    }
    const { priority, ...borrower } = form.getFieldsValue(true) as FormValues
    dispatch({
      type: 'submitDetails',
      priority,
      borrower: {
        ...borrower,
        spouseAgi: borrower.filing === 'single' ? 0 : (borrower.spouseAgi ?? 0),
        qualifyingPayments: borrower.pslf ? (borrower.qualifyingPayments ?? 0) : 0,
      },
    })
  }

  const shown = (index: number) => ({ display: stage === index ? 'block' : 'none' })

  return (
    <div className="screen">
      <ScreenIntro title="A plan that fits your life.">
        Three short steps. The numbers below are sample data, so change them to yours. Nothing is
        uploaded.
      </ScreenIntro>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Steps current={stage} size="small" items={STAGES.map((s) => ({ title: s.title }))} />

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ ...state.borrower, priority: state.priority }}
          style={{ marginTop: 32 }}
        >
          <div style={shown(0)}>
            <Form.Item
              name="balance"
              label="Total federal student loan balance"
              extra="An estimate is fine."
              rules={[{ required: true, type: 'number', min: 1, message: 'Enter your balance' }]}
            >
              <InputNumber {...dollars} />
            </Form.Item>
            <Form.Item
              name="rate"
              label="Average interest rate"
              extra="Most federal loans are between 4% and 9%."
              rules={[
                {
                  required: true,
                  type: 'number',
                  min: 0,
                  max: 15,
                  message: 'Enter a rate from 0 to 15',
                },
              ]}
            >
              <InputNumber
                suffix="%"
                min={0}
                max={15}
                step={0.1}
                controls={false}
                size="large"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="currentPlan" label="Plan you are on now">
              <Select
                size="large"
                options={[
                  { value: 'unsure', label: 'I’m not sure' },
                  { value: 'save', label: 'SAVE (ended in 2026)' },
                  { value: 'standard', label: 'Standard' },
                  { value: 'ibr', label: 'Income-Based Repayment (IBR)' },
                  { value: 'rap', label: 'Repayment Assistance Plan (RAP)' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="loanType"
              label="Type of loan"
              extra="Parent PLUS loans are borrowed by a parent for a child’s education."
            >
              <Segmented
                size="large"
                options={[
                  { label: 'My own loans', value: 'direct' },
                  { label: 'Parent PLUS', value: 'parentPlus' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="newLoansSinceJuly2026"
              label="Any new federal loan or consolidation since July 1, 2026?"
              extra={
                <>
                  Newer loans can only use <Term id="rap">RAP</Term> or a longer Standard plan.
                </>
              }
            >
              <Segmented size="large" options={YES_NO} />
            </Form.Item>
            <Form.Item
              name="borrowedBeforeJuly2014"
              label="Did you have federal loans before July 2014?"
              extra={
                <>
                  It changes the terms of <Term id="ibr">Income-Based Repayment</Term>.
                </>
              }
            >
              <Segmented size="large" options={YES_NO} />
            </Form.Item>
          </div>

          <div style={shown(1)}>
            <Form.Item
              name="agi"
              label="Your adjusted gross income (AGI) per year"
              extra="Line 11 on last year’s Form 1040. Your salary is a fine estimate."
              rules={[{ required: true, type: 'number', min: 0, message: 'Enter your income' }]}
            >
              <InputNumber {...dollars} />
            </Form.Item>
            <Form.Item name="state" label="State you live in">
              <Select
                size="large"
                showSearch
                optionFilterProp="label"
                options={STATES.map((s) => ({ value: s.code, label: s.name }))}
              />
            </Form.Item>
            <Form.Item
              name="familySize"
              label="People in your household, including you"
              rules={[
                { required: true, type: 'number', min: 1, max: 12, message: 'Enter at least 1' },
              ]}
            >
              <InputNumber min={1} max={12} size="large" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="dependents"
              label="Children you claim as dependents"
              extra={
                <>
                  <Term id="rap">RAP</Term> takes $50 a month off your payment for each one.
                </>
              }
              rules={[
                { required: true, type: 'number', min: 0, max: 10, message: 'Enter 0 if none' },
              ]}
            >
              <InputNumber min={0} max={10} size="large" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="filing" label="How you file taxes">
              <Segmented
                size="large"
                options={[
                  { label: 'Single', value: 'single' },
                  { label: 'Married, jointly', value: 'joint' },
                  { label: 'Married, separately', value: 'separate' },
                ]}
              />
            </Form.Item>
            {filing !== undefined && filing !== 'single' && (
              <Form.Item
                name="spouseAgi"
                label="Your spouse’s income per year"
                extra="Joint filers are assessed on both incomes."
                rules={[{ required: true, type: 'number', min: 0, message: 'Enter 0 if none' }]}
              >
                <InputNumber {...dollars} />
              </Form.Item>
            )}
          </div>

          <div style={shown(2)}>
            <Form.Item name="priority" label="What matters more to you?">
              <Segmented
                size="large"
                options={[
                  { label: 'Lower monthly payment', value: 'payment' },
                  { label: 'Lower total cost', value: 'total' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="pslf"
              label="Do you work full-time for a government or non-profit employer?"
              extra={
                <>
                  <Term id="pslf">Public Service Loan Forgiveness</Term> clears what is left after
                  120 payments.
                </>
              }
            >
              <Segmented size="large" options={YES_NO} />
            </Form.Item>
            {pslf && (
              <Form.Item
                name="qualifyingPayments"
                label="Qualifying payments you have already made"
                extra="A rough count is fine: one per month of public service."
                rules={[
                  { type: 'number', min: 0, max: 119, message: 'Enter a number from 0 to 119' },
                ]}
              >
                <InputNumber min={0} max={119} size="large" style={{ width: '100%' }} />
              </Form.Item>
            )}
          </div>
        </Form>

        <div className="actions">
          <Button
            size="large"
            onClick={() => (stage === 0 ? dispatch({ type: 'go', step: 0 }) : setStage(stage - 1))}
          >
            ← Back
          </Button>
          <Button type="primary" size="large" onClick={next}>
            {last ? 'See my options →' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
