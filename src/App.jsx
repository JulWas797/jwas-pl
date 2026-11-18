import { useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import BackgroundCanvas from './BackgroundCanvas.jsx'
import { playTapClick, playTone, useSnakeAudio } from './audio.js'

const ROOT_LINKS = [
  { label: 'github', to: 'https://github.com/JulWas797', external: true },
  { label: 'contact', to: '/contact', external: false },
  { label: 'projects', to: '/projects', external: false },
]

const CONTACT_LINKS = [
  { label: 'e-mail', to: 'mailto:admin@jwas.pl', external: true },
  { label: 'telegram', to: 'https://t.me/kierunek', external: true },
]

const PROJECT_LINKS = [
  { label: 'jtimebomb', to: 'https://github.com/julwas797/jtimebomb', external: true },
  { label: '(soon)', to: '', external: false },
]

const MEOW_VARIANTS = ['meow :3', 'mrrp ^w^', 'nya~ >w<', 'purr :3']

function Wordmark({ page, onSecretTrigger }) {
  const [expanded, setExpanded] = useState(false)
  const tapCountRef = useRef(0)
  const tapResetTimerRef = useRef(null)

  const handleRootTap = () => {
    setExpanded((prev) => !prev)
    tapCountRef.current += 1
    playTapClick(620 + tapCountRef.current * 55)

    clearTimeout(tapResetTimerRef.current)
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0
      playTone(520, 0.08, 'sine', 0.06, 980)
      onSecretTrigger?.()
    } else {
      tapResetTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0
      }, 2000)
    }
  }

  const letters = (
    <>
      <span className="wm-root">j</span>
      <span className="wm-ext">
        <span className="wm-ext-inner">ulian&nbsp;</span>
      </span>
      <span className="wm-root">was</span>
      <span className="wm-ext">
        <span className="wm-ext-inner">ilewski</span>
      </span>
    </>
  )

  return (
    <h1 className="wordmark-heading">
      {page ? (
        <Link to="/" className="wordmark" aria-label="julian wasilewski">
          {letters}
        </Link>
      ) : (
        <span
          role="button"
          tabIndex={0}
          aria-label="jwas — julian wasilewski"
          aria-expanded={expanded}
          className={`wordmark${expanded ? ' is-expanded' : ''}`}
          onClick={handleRootTap}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleRootTap()
            }
          }}
        >
          {letters}
        </span>
      )}
      {page && <span className="wordmark-page">/{page}</span>}
    </h1>
  )
}

function Layout({ page, subtitle, snakeMode, score, contentRef, onSecretTrigger, children }) {
  return (
    <div className="page">
      <main ref={contentRef} className="main">
        <Wordmark page={page} onSecretTrigger={onSecretTrigger} />
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {children}
      </main>
      <footer className="footer">
        {snakeMode ? `score: ${score}` : `(C) ${new Date().getFullYear()} jwas.pl`}
      </footer>
    </div>
  )
}

function LinkList({ items }) {
  return (
    <nav className="links">
      {items.map((item) => {
        if (!item.to) {
          return (
            <span key={item.label} className="link-item link-item--muted">
              {item.label}
            </span>
          )
        }

        if (item.external) {
          return (
            <a
              key={item.label}
              href={item.to}
              target="_blank"
              rel="noopener noreferrer"
              className="link-item"
            >
              {item.label}
            </a>
          )
        }

        return (
          <Link key={item.label} to={item.to} className="link-item">
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function RootPage({ snakeMode, score, contentRef, onSecretTrigger }) {
  return (
    <Layout
      subtitle="hobbyist software developer"
      snakeMode={snakeMode}
      score={score}
      contentRef={contentRef}
      onSecretTrigger={onSecretTrigger}
    >
      <LinkList items={ROOT_LINKS} />
    </Layout>
  )
}

function ContactPage({ contentRef }) {
  return (
    <Layout page="contact" subtitle="feel free to reach me out!" contentRef={contentRef}>
      <LinkList items={CONTACT_LINKS} />
    </Layout>
  )
}

function ProjectsPage({ contentRef }) {
  return (
    <Layout page="projects" subtitle="my projects" contentRef={contentRef}>
      <LinkList items={PROJECT_LINKS} />
    </Layout>
  )
}

function MeowPage({ contentRef }) {
  const [variantIndex, setVariantIndex] = useState(0)
  const label = MEOW_VARIANTS[variantIndex]

  return (
    <Layout page="meow" subtitle="^w^" contentRef={contentRef}>
      <p
        key={variantIndex}
        role="button"
        tabIndex={0}
        className="statement statement--meow"
        onClick={() => setVariantIndex((prev) => (prev + 1) % MEOW_VARIANTS.length)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setVariantIndex((prev) => (prev + 1) % MEOW_VARIANTS.length)
          }
        }}
      >
        {label.split('').map((character, index) => (
          <span
            key={index}
            className="meow-char"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            {character === ' ' ? '\u00A0' : character}
          </span>
        ))}
      </p>
    </Layout>
  )
}

function NotFoundPage({ contentRef }) {
  return (
    <Layout page="404" subtitle="page not found!" contentRef={contentRef}>
      <p className="statement">404</p>
    </Layout>
  )
}

export default function App() {
  const [snakeMode, setSnakeMode] = useState(false)
  const [score, setScore] = useState(0)
  const contentRef = useRef(null)

  useSnakeAudio(snakeMode)

  return (
    <BrowserRouter>
      <BackgroundCanvas
        snakeMode={snakeMode}
        contentRef={contentRef}
        onScoreChange={setScore}
        onExitSnake={() => setSnakeMode(false)}
      />
      <Routes>
        <Route path="/contact" element={<ContactPage contentRef={contentRef} />} />
        <Route path="/projects" element={<ProjectsPage contentRef={contentRef} />} />
        <Route path="/meow" element={<MeowPage contentRef={contentRef} />} />
        <Route
          path="/"
          element={
            <RootPage
              snakeMode={snakeMode}
              score={score}
              contentRef={contentRef}
              onSecretTrigger={() => setSnakeMode((prev) => !prev)}
            />
          }
        />
        <Route path="*" element={<NotFoundPage contentRef={contentRef} />} />
      </Routes>
    </BrowserRouter>
  )
}
