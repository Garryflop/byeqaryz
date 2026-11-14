import { App as AntApp, Button, ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import { useState } from 'react'
import { BRAND, TEAM } from './brand'
import { FaqModal } from './components/FaqModal'
import { Compare } from './screens/Compare'
import { Details } from './screens/Details'
import { Intro } from './screens/Intro'
import { NextSteps } from './screens/NextSteps'
import { Options } from './screens/Options'
import { Purchase } from './screens/Purchase'
import { Understand } from './screens/Understand'
import { STEPS, StoreProvider, useStore } from './state/store'

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

/** Ant Design restyled to the monochrome palette in DESIGN.md. */
const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1d1d1f',
    colorInfo: '#1d1d1f',
    colorSuccess: '#1d1d1f',
    colorLink: '#1d1d1f',
    colorText: '#1d1d1f',
    colorTextSecondary: '#6e6e73',
    colorTextDescription: '#6e6e73',
    colorBorder: '#d2d2d7',
    colorBorderSecondary: '#d2d2d7',
    colorBgLayout: '#ffffff',
    colorFillAlter: '#f5f5f7',
    colorFillSecondary: '#e8e8ed',
    colorFillTertiary: '#f5f5f7',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: FONT,
  },
  components: {
    // Buttons are capsules; everything else keeps a soft corner.
    Button: {
      borderRadius: 999,
      borderRadiusLG: 999,
      borderRadiusSM: 999,
      primaryShadow: 'none',
      defaultShadow: 'none',
      fontWeight: 500,
    },
    Segmented: { itemSelectedBg: '#ffffff', trackBg: '#f5f5f7' },
    Tabs: { inkBarColor: '#1d1d1f', itemSelectedColor: '#1d1d1f', itemHoverColor: '#515154' },
    Collapse: { headerBg: '#ffffff' },
    Slider: {
      trackBg: '#1d1d1f',
      trackHoverBg: '#515154',
      handleColor: '#1d1d1f',
      handleActiveColor: '#1d1d1f',
    },
  },
}

const SCREENS = [Intro, Details, Options, Compare, Understand, Purchase, NextSteps]

function Shell() {
  const { state, dispatch } = useStore()
  const [faqOpen, setFaqOpen] = useState(false)
  const Screen = SCREENS[state.step]

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <button
            type="button"
            className="brand"
            onClick={() => dispatch({ type: 'go', step: 0 })}
            aria-label={`${BRAND}: back to the start`}
          >
            <img src="/logo.png" width={107} height={26} alt={BRAND} />
          </button>

          {state.step > 0 && (
            <nav className="steps" aria-label="Steps">
              {STEPS.map(({ step, label }) => (
                <button
                  key={step}
                  type="button"
                  className="step"
                  disabled={step > state.reached}
                  aria-current={step === state.step ? 'step' : undefined}
                  onClick={() => dispatch({ type: 'go', step })}
                >
                  <span>{step}</span>
                  <span className="step-label">{label}</span>
                </button>
              ))}
            </nav>
          )}

          <Button type="text" onClick={() => setFaqOpen(true)}>
            FAQ
          </Button>
        </div>
      </header>

      {/* The key restarts the entry animation and the focus move on each step. */}
      <main key={state.step}>
        <Screen />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-team">
            Built by team
            <img src="/team.png" width={96} height={22} alt={TEAM} draggable={false} />
            {YEAR}
          </span>
          <span>
            {BRAND} gives estimates from published federal rules. It is not affiliated with the U.S.
            Department of Education and is not financial advice.
          </span>
        </div>
      </footer>

      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  )
}

const YEAR = new Date().getFullYear()

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </AntApp>
    </ConfigProvider>
  )
}
