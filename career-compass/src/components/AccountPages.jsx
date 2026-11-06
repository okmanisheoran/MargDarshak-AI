import { useCallback, useEffect, useRef, useState } from 'react'
import { requestJson } from '../api.js'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

async function postJson(url, payload) {
  return requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 'Account service')
}

function GoogleSignInButton({ onCredential, disabled }) {
  const buttonRef = useRef(null)
  const credentialHandler = useCallback((response) => {
    if (response.credential) onCredential(response.credential)
  }, [onCredential])

  useEffect(() => {
    if (!googleClientId || !buttonRef.current) return undefined

    let active = true
    const button = buttonRef.current
    const renderGoogleButton = () => {
      if (!active || !window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: credentialHandler,
      })
      window.google.accounts.id.renderButton(button, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.min(button.clientWidth, 360),
      })
    }

    let script = document.querySelector('script[data-google-identity]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
      document.head.append(script)
    }
    script.addEventListener('load', renderGoogleButton)
    renderGoogleButton()

    return () => {
      active = false
      script?.removeEventListener('load', renderGoogleButton)
      button.replaceChildren()
    }
  }, [credentialHandler])

  if (!googleClientId) {
    return <p className="account-provider-note">Google sign-in will appear after VITE_GOOGLE_CLIENT_ID is configured.</p>
  }
  return <div className={`google-sign-in ${disabled ? 'is-disabled' : ''}`} ref={buttonRef} aria-label="Continue with Google" />
}

export function AuthPage({ onAuthenticated, onBack, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const authenticateWithGoogle = useCallback(async (credential) => {
    setStatus('loading')
    setErrorMessage('')
    try {
      await postJson('/api/auth/google', { credential })
      await onAuthenticated()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Google sign-in could not be completed.')
      setStatus('error')
    }
  }, [onAuthenticated])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      await postJson(`/api/auth/${mode}`, mode === 'signup'
        ? { name, email, password }
        : { email, password })
      await onAuthenticated()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Your account request could not be completed.')
      setStatus('error')
    }
  }

  const toggleMode = (nextMode) => {
    setMode(nextMode)
    setStatus('idle')
    setErrorMessage('')
  }

  return (
    <section className="account-page">
      <div className="account-panel">
        <button className="account-back-link" type="button" onClick={onBack}>← Back to MargDarshak-AI</button>
        <span className="account-eyebrow">YOUR OWN SPACE TO GROW</span>
        <h1>{mode === 'signup' ? 'Keep your next steps close.' : 'Welcome back.'}</h1>
        <p className="account-intro">{mode === 'signup'
          ? 'Create a private account to save your career plan and track progress over time.'
          : 'Sign in to pick up where you left off.'}</p>

        <div className="account-mode-switch" role="tablist" aria-label="Account action">
          <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'selected' : ''} onClick={() => toggleMode('signup')}>Create account</button>
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'selected' : ''} onClick={() => toggleMode('login')}>Sign in</button>
        </div>

        <form className="account-form" onSubmit={handleSubmit}>
          {mode === 'signup' && <label>
            <span>Your name</span>
            <input autoComplete="name" maxLength={80} minLength={2} name="name" onChange={(event) => setName(event.target.value)} required value={name} />
          </label>}
          <label>
            <span>Email address</span>
            <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label>
            <span>Password <small>(at least 12 characters)</small></span>
            <input autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} maxLength={128} minLength={12} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {errorMessage && <p className="account-error" role="alert">{errorMessage}</p>}
          <button className="button button-electric account-submit" disabled={status === 'loading'} type="submit">
            {status === 'loading' ? 'Securing your account…' : mode === 'signup' ? 'Create my account' : 'Sign in securely'}
          </button>
        </form>

        <div className="account-divider"><span>or continue with</span></div>
        <GoogleSignInButton disabled={status === 'loading'} onCredential={authenticateWithGoogle} />
        <p className="account-privacy">Your name, email, password and assessment answers stay in private backend storage. Passwords are never stored as plain text, and account details are not returned to the browser.</p>
      </div>
      <aside className="account-aside">
        <span className="account-aside-mark">✳</span>
        <span className="account-eyebrow">A PRIVATE PLACE TO PLAN</span>
        <h2>Small steps add up to a direction that feels like yours.</h2>
        <ul><li>Your career analysis saved to your account</li><li>A six-month roadmap you can revisit</li><li>Progress that follows you between sessions</li></ul>
      </aside>
    </section>
  )
}

export function FeedbackPage() {
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const submitFeedback = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      await postJson('/api/feedback', { rating, message })
      setStatus('success')
      setMessage('')
      setRating(0)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Feedback could not be saved.')
      setStatus('error')
    }
  }

  return (
    <section className="feedback-layout">
      <div className="feedback-copy">
        <span className="account-eyebrow">HELP US MAKE THIS BETTER</span>
        <h1>Your perspective matters.</h1>
        <p>Tell us what was useful, what felt unclear, or what would make MargDarshak-AI more helpful for your journey.</p>
        <div className="feedback-promise"><strong>Thoughtful by design</strong><span>Your feedback is stored privately with your account and is never displayed publicly.</span></div>
      </div>
      <form className="feedback-form" onSubmit={submitFeedback}>
        <fieldset>
          <legend>How was your experience?</legend>
          <div className="feedback-rating" role="radiogroup" aria-label="Experience rating">
            {[1, 2, 3, 4, 5].map((value) => <button
              aria-checked={rating === value}
              aria-label={`${value} out of 5`}
              className={rating === value ? 'selected' : ''}
              key={value}
              onClick={() => setRating(value)}
              role="radio"
              type="button"
            >{value}</button>)}
          </div>
        </fieldset>
        <label className="feedback-message">
          <span>What should we know?</span>
          <textarea maxLength={2000} minLength={10} onChange={(event) => setMessage(event.target.value)} placeholder="Share a suggestion or tell us what worked well…" required value={message} />
          <small>{message.length} / 2000</small>
        </label>
        {errorMessage && <p className="account-error" role="alert">{errorMessage}</p>}
        {status === 'success' && <p className="feedback-success" role="status">Thank you. Your feedback has been saved privately.</p>}
        <button className="button button-electric" disabled={status === 'loading' || rating === 0} type="submit">{status === 'loading' ? 'Sending securely…' : 'Send private feedback'}</button>
      </form>
    </section>
  )
}

export function ProgressPage({ analysis, navigate }) {
  const [months, setMonths] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    requestJson('/api/progress', undefined, 'Progress service')
      .then((result) => result.months)
      .then((result) => {
        if (!active) return
        setMonths(result)
        setStatus('success')
      })
      .catch((error) => {
        if (!active) return
        setErrorMessage(error instanceof Error ? error.message : 'Progress could not be loaded.')
        setStatus('error')
      })
    return () => { active = false }
  }, [])

  const toggleMonth = async (month) => {
    const current = months.find((item) => item.month === month)
    if (!current) return
    setErrorMessage('')
    try {
      await requestJson(`/api/progress/${month}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !current.completed }),
      }, 'Progress service')
      setMonths((previous) => previous.map((item) => item.month === month ? { ...item, completed: !current.completed } : item))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Progress could not be saved.')
    }
  }

  const completed = months.filter((month) => month.completed).length
  return (
    <>
      <div className="page-heading">
        <div><span className="eyebrow">KEEP YOUR MOMENTUM</span><h1>Your progress, your pace.</h1><p>Small wins count. Mark each month as you make your way through the roadmap.</p></div>
        {months.length > 0 && <div className="progress-summary"><strong>{completed}<span> / {months.length}</span></strong><small>months explored</small></div>}
      </div>
      {status === 'loading' && <p role="status">Loading your saved progress…</p>}
      {status === 'error' && <p className="account-error" role="alert">{errorMessage}</p>}
      {status === 'success' && months.length === 0 && <section className="panel saved-assessment-empty">
        <div><strong>Your roadmap will live here</strong><p>Complete an assessment and your six-month plan will be saved to your account.</p></div>
        <button className="button button-electric" onClick={() => navigate('assessment')}>Create my roadmap</button>
      </section>}
      {status === 'success' && months.length > 0 && <ol className="progress-list">
        {months.map((month) => {
          const roadmap = analysis?.sixMonthRoadmap[month.month - 1]
          return <li className={`progress-month ${month.completed ? 'is-complete' : ''}`} key={month.month}>
            <span className="progress-month-number">{String(month.month).padStart(2, '0')}</span>
            <div className="progress-month-copy"><span>MONTH {month.month}</span><h2>{month.focus}</h2><p>{roadmap?.milestone ?? 'Keep exploring this month’s learning focus.'}</p></div>
            <button aria-pressed={month.completed} className="progress-toggle" onClick={() => toggleMonth(month.month)} type="button">{month.completed ? 'Completed ✓' : 'Mark complete'}</button>
          </li>
        })}
      </ol>}
      {errorMessage && status === 'success' && <p className="account-error" role="alert">{errorMessage}</p>}
    </>
  )
}

export function LandingSections({ navigate }) {
  return (
    <>
      <section className="landing-story" id="about">
        <div className="landing-story-heading"><span className="eyebrow">WHAT WE STAND FOR</span><h2>Guidance that respects your real life.</h2><p>Career choices should open doors, not add pressure. MargDarshak-AI helps learners find practical directions that fit their interests, strengths and circumstances.</p></div>
        <div className="landing-values">
          <article><span>01</span><h3>Possibility, not pressure</h3><p>Explore a few thoughtful directions. No single path defines your future.</p></article>
          <article><span>02</span><h3>Grounded in your context</h3><p>Bring your study stage, Indian curriculum, priorities and questions into the plan.</p></article>
          <article><span>03</span><h3>Make learning tangible</h3><p>Turn ideas into skills, small projects and manageable next steps.</p></article>
        </div>
      </section>
      <section className="landing-how" id="how-it-works">
        <div><span className="eyebrow">A SIMPLE WAY TO BEGIN</span><h2>From curiosity to a plan you can use.</h2></div>
        <div className="landing-how-steps"><p><strong>01 · Share what matters</strong><span>Tell us about your interests, strengths and practical priorities.</span></p><p><strong>02 · Explore three paths</strong><span>Get career ideas with reasons, skills and areas to grow.</span></p><p><strong>03 · Take your next step</strong><span>Use your six-month roadmap and track progress at your own pace.</span></p></div>
      </section>
      <nav className="landing-footer-links" aria-label="Explore MargDarshak-AI">
        <span>Keep exploring</span>
        <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About us</button>
        <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button>
        <button onClick={() => navigate('auth')}>Sign up / sign in</button>
        <button onClick={() => navigate('progress')}>Progress tracking</button>
        <button onClick={() => navigate('feedback')}>Feedback</button>
      </nav>
    </>
  )
}
