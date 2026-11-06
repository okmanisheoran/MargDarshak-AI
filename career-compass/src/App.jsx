import { useCallback, useEffect, useRef, useState } from 'react'
import CareerResultsDashboard from './components/CareerResultsDashboard.jsx'
import { AuthPage, FeedbackPage, LandingSections, ProgressPage } from './components/AccountPages.jsx'
import './App.css'

const iconPaths = {
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  clipboard: <><rect x="5" y="5" width="14" height="16" rx="2" /><path d="M9 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5M9 11h6M9 15h6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
  chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" /><path d="M4 16h16M8 7h7M8 10h7" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 3l.7 1.8L7.5 5.5l-1.8.7L5 8l-.7-1.8-1.8-.7 1.8-.7L5 3Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6a7.5 7.5 0 1 1 17-3.5Z" /><path d="M8 11h8M8 14h5" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
}

function Icon({ name, size = 20 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>
}

const navigation = [
  { label: 'Overview', icon: 'grid', page: 'overview' },
  { label: 'My assessment', icon: 'clipboard', page: 'assessment' },
  { label: 'Career paths', icon: 'briefcase', page: 'careers' },
  { label: 'Skills profile', icon: 'chart', page: 'skills' },
  { label: 'Learning roadmap', icon: 'book', page: 'roadmap' },
  { label: 'Progress tracking', icon: 'target', page: 'progress' },
  { label: 'Feedback', icon: 'message', page: 'feedback' },
]

function Brand() {
  return <div className="brand"><span className="brand-mark"><Icon name="compass" size={23} /></span><span>Marg<span className="brand-light">Darshak-AI</span></span></div>
}

function AccountMenu({ authenticated, onOpenAuth, onSwitchAccount, onLogout }) {
  const menuRef = useRef(null)
  const runAction = (action) => {
    if (menuRef.current) menuRef.current.open = false
    action()
  }

  if (!authenticated) {
    return <button className="avatar top-avatar account-menu-guest" type="button" aria-label="Open sign in" onClick={onOpenAuth}>✳</button>
  }

  return <details className="account-menu" ref={menuRef}>
    <summary className="avatar top-avatar account-menu-trigger" aria-label="Open account menu">MD</summary>
    <div className="account-menu-popover" aria-label="Account menu">
      <span className="account-menu-label">SIGNED IN</span>
      <button type="button" onClick={() => runAction(onSwitchAccount)}>Switch account</button>
      <button type="button" onClick={() => runAction(onLogout)}>Sign out</button>
    </div>
  </details>
}

function Sidebar({ activePage, onNavigate, isOpen, onClose, authenticated, onLogout }) {
  const visibleNavigation = authenticated
    ? navigation
    : [{ label: 'Overview', icon: 'grid', page: 'overview' }, { label: 'Sign up / sign in', icon: 'user', page: 'auth' }]
  return (
    <>
      {isOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" onClick={onClose} aria-label="Close menu"><Icon name="close" /></button></div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {visibleNavigation.map((item) => <button key={item.page} className={`nav-item ${activePage === item.page ? 'active' : ''}`} onClick={() => { onNavigate(item.page); onClose() }}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="mentor-card"><span className="mentor-spark"><Icon name="spark" size={18} /></span><strong>A little guidance goes a long way.</strong><p>Your plan is a starting point. Make it yours, one step at a time.</p><button onClick={() => onNavigate(authenticated ? 'assessment' : 'auth')}>{authenticated ? 'Refine your plan' : 'Create your space'} <Icon name="arrow" size={15} /></button></div>
          {authenticated && <button className="profile-button" onClick={onLogout}><span className="avatar">MD</span><span className="profile-meta"><strong>Private account</strong><small>Sign out securely</small></span><span className="profile-dots">↗</span></button>}
        </div>
      </aside>
    </>
  )
}

function Topbar({ onMenu, query, setQuery, authenticated, activePage, onOpenAuth, onSwitchAccount, onLogout }) {
  const title = navigation.find((item) => item.page === activePage)?.label ?? (activePage === 'auth' ? 'Your account' : 'About MargDarshak-AI')
  return <header className="topbar"><button className="icon-button menu-button" aria-label="Open navigation" onClick={onMenu}><Icon name="menu" /></button><div className="breadcrumb"><span>MargDarshak-AI</span><Icon name="chevron" size={14} /><strong>{title}</strong></div><div className="topbar-actions"><label className="search-box"><Icon name="search" size={18} /><input aria-label="Search careers and skills" placeholder="Search anything..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Notifications"><Icon name="bell" size={19} /><span /></button><AccountMenu authenticated={authenticated} onOpenAuth={onOpenAuth} onSwitchAccount={onSwitchAccount} onLogout={onLogout} /></div></header>
}

function PageHeading({ eyebrow, title, description, children }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{children && <div className="heading-action">{children}</div>}</div>
}

function MatchRing({ value = 78, displayValue = value, unit = '%' }) {
  return <div className="match-ring" aria-label={unit === '%' ? `${displayValue} percent career alignment` : `${displayValue} personalized career recommendations`}><svg viewBox="0 0 110 110" aria-hidden="true"><circle className="ring-track" cx="55" cy="55" r="47" />{value !== null && <circle className="ring-value" cx="55" cy="55" r="47" strokeDasharray={`${(value / 100) * 295.3} 295.3`} />}</svg><span><strong>{displayValue}</strong><small>{unit}</small></span></div>
}

function Overview({ navigate, query, analysis }) {
  if (!analysis) {
    return <>
      <PageHeading eyebrow="A LITTLE CLARITY, A LOT OF POSSIBILITY" title="Your next chapter, on your terms." description="A thoughtful starting point for finding work that feels like you." />
      <section className="welcome-bento" aria-label="MargDarshak-AI introduction">
        <article className="welcome-bento-main">
          <div className="welcome-bento-copy">
            <span className="welcome-bento-kicker"><Icon name="spark" size={16} /> YOUR CAREER COMPASS</span>
            <h2>Find your<br />way forward.</h2>
            <p>Tell us what draws your curiosity, what you do well, and what matters in your life. We’ll shape it into three grounded career ideas and a practical plan.</p>
            <button className="button button-electric" onClick={() => navigate('assessment')}>Begin your assessment <Icon name="arrow" size={17} /></button>
            <span className="welcome-bento-note">About 3 minutes · No right or wrong answers</span>
          </div>
          <div className="welcome-bento-art" aria-hidden="true">
            <span className="bento-orbit bento-orbit-one" />
            <span className="bento-orbit bento-orbit-two" />
            <span className="bento-compass"><Icon name="compass" size={48} /></span>
            <span className="bento-art-caption">A direction<br />worth exploring</span>
          </div>
        </article>
        <button className="welcome-bento-card bento-paths" onClick={() => navigate('assessment')}>
          <span className="bento-card-index">01 / EXPLORE</span>
          <strong>Five career paths</strong>
          <span>Chosen around your interests, strengths and priorities.</span>
          <span className="bento-card-action">Discover yours <Icon name="arrow" size={16} /></span>
        </button>
        <button className="welcome-bento-card bento-skills" onClick={() => navigate('assessment')}>
          <span className="bento-card-index">02 / BUILD</span>
          <strong>Skills that matter</strong>
          <span>See what each path asks for and what you can grow next.</span>
          <span className="bento-card-action">Find your starting point <Icon name="arrow" size={16} /></span>
        </button>
        <button className="welcome-bento-card bento-roadmap" onClick={() => navigate('assessment')}>
          <span className="bento-card-index">03 / MAKE IT REAL</span>
          <strong>A plan you can use</strong>
          <span>Get a six-month roadmap with beginner projects you can actually try.</span>
          <span className="bento-card-action">See what’s possible <Icon name="arrow" size={16} /></span>
        </button>
      </section>
      <LandingSections navigate={navigate} />
    </>
  }

  const filteredRecommendations = analysis.careerSuggestions.filter((career) => `${career.title} ${career.reasoning} ${career.requiredSkills.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <>
      <PageHeading eyebrow="YOUR PERSONALIZED CAREER PLAN" title="Your career snapshot" description="A clearer path starts with knowing where you are." >
        <button className="button button-outline" onClick={() => navigate('assessment')}><Icon name="clipboard" size={17} /> Update assessment</button>
      </PageHeading>
      <section className="snapshot-card">
        <div className="snapshot-copy">
          <span className="snapshot-label"><Icon name="spark" size={15} /> YOUR CAREER SNAPSHOT</span>
          <h2>{analysis.careerSuggestions.length} directions<br className="desktop-break" /> to explore.</h2>
          <p>{analysis.summary}</p>
          <button className="button button-white" onClick={() => navigate('careers')}>Explore your career matches <Icon name="arrow" size={16} /></button>
        </div>
        <div className="snapshot-visual">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="orbit-label"><span className="orbit-dot" /> YOUR CAREER ALIGNMENT</div>
          <MatchRing value={null} displayValue={analysis.careerSuggestions.length} unit="paths" />
          <div className="visual-caption">A strong place to start</div>
          <div className="visual-note note-one"><span className="note-icon note-icon-blue">✳</span><span><strong>{analysis.careerSuggestions[0].title}</strong><small>Top recommendation</small></span><Icon name="chevron" size={16} /></div>
          <div className="visual-note note-two"><span className="note-icon note-icon-gold">↗</span><span><strong>Skill to explore</strong><small>{analysis.careerSuggestions[0].requiredSkills[0]}</small></span></div>
        </div>
      </section>
      <div className="section-heading"><div><span className="eyebrow">A FEW GOOD DIRECTIONS</span><h2>Career paths that fit you</h2></div><button className="text-link" onClick={() => navigate('careers')}>See all paths <Icon name="arrow" size={16} /></button></div>
      {filteredRecommendations.length === 0 && <p className="empty-search">No career paths match “{query}”. Try a different search.</p>}
      <section className="career-grid" aria-label="AI-recommended career paths">{filteredRecommendations.map((career) => <CareerRecommendationCard key={career.title} career={career} />)}</section>
      <section className="bottom-grid">
        <SkillsCard navigate={navigate} analysis={analysis} />
        <RoadmapPreview navigate={navigate} analysis={analysis} />
      </section>
    </>
  )
}

function CareerRecommendationCard({ career }) {
  const [flipped, setFlipped] = useState(false)
  const firstGap = career.potentialSkillGaps[0]
  return <article className={`career-flip-card ${flipped ? 'is-flipped' : ''}`}>
    <div className="career-flip-inner">
      <div className="career-flip-face career-flip-front">
        <span className="career-flip-kicker"><Icon name="spark" size={16} /> CAREER DIRECTION</span>
        <h3>{career.title}</h3>
        <button className="career-flip-action" type="button" aria-expanded={flipped} onClick={() => setFlipped(true)}>
          Hover or select to explore <Icon name="arrow" size={16} />
        </button>
      </div>
      <div className="career-flip-face career-flip-back" aria-hidden={!flipped}>
        <div className="career-flip-back-heading"><span>WHY IT COULD FIT</span><button type="button" tabIndex={flipped ? 0 : -1} aria-label={`Return to ${career.title}`} onClick={() => setFlipped(false)}>Back</button></div>
        <p>{career.reasoning}</p>
        <strong className="career-flip-label">Skills to explore</strong>
        <div className="career-flip-skills">{career.requiredSkills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div>
        {firstGap && <p className="career-flip-first-step"><strong>First small step:</strong> {firstGap.firstAction}</p>}
      </div>
    </div>
  </article>
}

function SkillsCard({ navigate, analysis }) {
  const requiredSkills = [...new Set(analysis.careerSuggestions.flatMap((career) => career.requiredSkills))].slice(0, 5)
  return <section className="panel skills-panel"><div className="panel-heading"><div><span className="eyebrow">SKILLS TO EXPLORE</span><h2>Skills profile</h2></div><button className="icon-link" aria-label="View all skills" onClick={() => navigate('skills')}><Icon name="arrow" size={17} /></button></div><div className="skill-list">{requiredSkills.map((skill) => <div className="skill-row" key={skill}><div className="skill-info"><span>{skill}</span><span className="skill-level blue">REQUIRED</span></div></div>)}</div><button className="panel-footer-link" onClick={() => navigate('skills')}>View all skills <Icon name="arrow" size={15} /></button></section>
}

function RoadmapPreview({ navigate, analysis }) {
  return <section className="panel roadmap-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Learning roadmap</h2></div><button className="icon-link" aria-label="View learning roadmap" onClick={() => navigate('roadmap')}><Icon name="arrow" size={17} /></button></div><div className="roadmap-mini">{analysis.sixMonthRoadmap.slice(0, 3).map((month) => <div className="mini-step" key={month.month}><span className="step-check">{String(month.month).padStart(2, '0')}</span><span><small>MONTH {month.month}</small><strong>{month.focus}</strong></span><Icon name="chevron" size={16} /></div>)}</div><button className="panel-footer-link" onClick={() => navigate('roadmap')}>Open your roadmap <Icon name="arrow" size={15} /></button></section>
}

const assessmentSteps = [
  { title: 'About you', caption: 'A little context helps us start in the right place.' },
  { title: 'What interests you', caption: 'Choose the subjects and activities you enjoy exploring.' },
  { title: 'Your strengths', caption: 'Tell us what you bring and what matters in your future work.' },
  { title: 'Customize your guidance', caption: 'Add Indian study context and practical preferences so the plan fits your situation.' },
  { title: 'Review your answers', caption: 'Take a moment to make sure everything feels right.' },
]

const interestOptions = [
  { title: 'Design & creativity', detail: 'Making ideas clear and useful', symbol: '✳' },
  { title: 'Technology', detail: 'Exploring how things work', symbol: '⌘' },
  { title: 'People & society', detail: 'Understanding and helping others', symbol: '◎' },
  { title: 'Business & leadership', detail: 'Building ideas into action', symbol: '↗' },
  { title: 'Science & nature', detail: 'Asking questions and finding patterns', symbol: '⌁' },
  { title: 'Writing & communication', detail: 'Sharing stories and information', symbol: '¶' },
]

const strengthOptions = [
  'Creative problem-solving',
  'Writing and communication',
  'Research and curiosity',
  'Teamwork and listening',
  'Planning and organization',
  'Numbers and analysis',
]

const requiredByStep = [
  ['educationLevel', 'studyArea'],
  ['interests'],
  ['strengths', 'workPriority'],
  [],
  [],
]

const careerPathCounts = [5, 6, 7, 8, 9, 10]
const educationOptions = ['High school', 'College / undergraduate', 'Graduate school', 'Vocational or technical program', 'Taking a gap year']
const studyAreaOptions = ['Arts & humanities', 'Business & economics', 'Computer science & technology', 'Education', 'Engineering & mathematics', 'Health & life sciences', 'Social sciences', 'Undecided / exploring']
const workPriorityOptions = ['Doing meaningful work', 'Room to keep learning', 'Creative freedom', 'Job stability', 'Flexible work and balance', 'Making a positive impact']
const indiaContextOptions = ['CBSE', 'CISCE (ICSE / ISC)', 'State board', 'NIOS / open schooling', 'Other / not sure']
const indiaStudyStageOptions = [
  'Class 9–10',
  'Class 11–12: science with mathematics',
  'Class 11–12: science with biology',
  'Class 11–12: commerce',
  'Class 11–12: humanities / arts',
  'Class 12 completed',
  'Diploma / polytechnic',
  'Undergraduate college',
  'Postgraduate study',
  'Other / not sure',
]
const practicalPriorityOptions = [
  'JEE / engineering entrance pathway',
  'NEET / healthcare entrance pathway',
  'CUET / undergraduate admissions',
  'CLAT / law entrance pathway',
  'CA, CMA, or CS pathway',
  'NIFT / NID / design entrance pathway',
  'Government or public-service exams',
  'Affordable or free learning resources',
  'Scholarships and lower-cost study options',
  'Opportunities in my city or region',
  'Remote work or online learning access',
  'Hindi or regional-language resources',
  'Balancing study with work or family responsibilities',
  'Internships and practical experience',
]

function validateAssessmentForm(form) {
  const errors = {}
  if (!form || typeof form !== 'object') {
    return { errors: { educationLevel: 'Please complete the assessment before continuing.' }, step: 0 }
  }

  if (!educationOptions.includes(form.educationLevel)) errors.educationLevel = 'Choose your current stage of study.'
  if (!studyAreaOptions.includes(form.studyArea)) errors.studyArea = 'Choose an area of study.'
  if (!Array.isArray(form.interests) || form.interests.length === 0) {
    errors.interests = 'Choose at least one area to continue.'
  } else if (form.interests.some((interest) => !interestOptions.some((option) => option.title === interest))) {
    errors.interests = 'Choose interests from the options shown.'
  }
  if (!Array.isArray(form.strengths) || form.strengths.length === 0) {
    errors.strengths = 'Select at least one strength to continue.'
  } else if (form.strengths.some((strength) => !strengthOptions.includes(strength))) {
    errors.strengths = 'Choose strengths from the options shown.'
  }
  if (!workPriorityOptions.includes(form.workPriority)) errors.workPriority = 'Choose a career priority.'
  if (!careerPathCounts.includes(form.careerPathCount)) {
    errors.careerPathCount = 'Choose between 5 and 10 career paths.'
  }
  if (form.indiaContext !== '' && !indiaContextOptions.includes(form.indiaContext)) {
    errors.indiaContext = 'Choose a study context from the options shown.'
  }
  if (form.indiaStudyStage !== '' && !indiaStudyStageOptions.includes(form.indiaStudyStage)) {
    errors.indiaStudyStage = 'Choose a study stage from the options shown.'
  }
  if (!Array.isArray(form.practicalPriorities)
    || form.practicalPriorities.length > 5
    || form.practicalPriorities.some((priority) => !practicalPriorityOptions.includes(priority))
    || new Set(form.practicalPriorities).size !== form.practicalPriorities.length) {
    errors.practicalPriorities = 'Choose valid preferences from the options shown.'
  }
  if (typeof form.customRequest !== 'string' || form.customRequest.length > 500) {
    errors.customRequest = 'Keep your custom request within 500 characters.'
  }

  const fieldSteps = { educationLevel: 0, studyArea: 0, interests: 1, strengths: 2, workPriority: 2, careerPathCount: 3, indiaContext: 3, indiaStudyStage: 3, practicalPriorities: 3, customRequest: 3 }
  const firstInvalidField = Object.keys(fieldSteps).find((field) => errors[field])
  return { errors, step: firstInvalidField ? fieldSteps[firstInvalidField] : 0 }
}

function SelectField({ id, label, value, options, placeholder, error, onChange }) {
  return (
    <label className={`assessment-select-field ${error ? 'has-error' : ''}`} htmlFor={id}>
      <span>{label}<span className="required-mark"> *</span></span>
      <select id={id} value={value} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={(event) => onChange(id, event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
    </label>
  )
}

function ChoiceCards({ options, selected, onToggle, error }) {
  return (
    <div>
      <div className="choice-card-grid" role="group" aria-label="Career interests">
        {options.map((option) => {
          const isSelected = selected.includes(option.title)
          return <button key={option.title} type="button" className={`choice-card ${isSelected ? 'selected' : ''}`} aria-pressed={isSelected} onClick={() => onToggle(option.title)}>
            <span className="choice-card-symbol">{option.symbol}</span>
            <span className="choice-card-copy"><strong>{option.title}</strong><small>{option.detail}</small></span>
            <span className="choice-card-check">{isSelected && <Icon name="check" size={13} />}</span>
          </button>
        })}
      </div>
      {error && <p className="field-error group-error" role="alert">{error}</p>}
    </div>
  )
}

function CheckboxGroup({ options, selected, onToggle, error, label, maxSelections }) {
  return (
    <div>
      <div className="strength-checkbox-grid" role="group" aria-label={label}>
        {options.map((option) => {
          const isSelected = selected.includes(option)
          const isLimitReached = maxSelections !== undefined && selected.length >= maxSelections && !isSelected
          return (
            <label className={`strength-checkbox ${isSelected ? 'checked' : ''} ${isLimitReached ? 'limit-reached' : ''}`} key={option}>
              <input type="checkbox" checked={isSelected} disabled={isLimitReached} onChange={() => onToggle(option)} />
              <span className="custom-checkbox">{isSelected && <Icon name="check" size={12} />}</span>
              <span>{option}</span>
            </label>
          )
        })}
      </div>
      {error && <p className="field-error group-error" role="alert">{error}</p>}
    </div>
  )
}

function CustomizationStep({ form, errors, onChange, onTogglePriority }) {
  return (
    <div className="assessment-customization">
      <div className="assessment-fields-grid assessment-india-fields">
        <label className={`assessment-select-field ${errors.careerPathCount ? 'has-error' : ''}`} htmlFor="careerPathCount">
          <span>How many career paths should we explore?</span>
          <select
            id="careerPathCount"
            value={form.careerPathCount}
            aria-invalid={Boolean(errors.careerPathCount)}
            aria-describedby={errors.careerPathCount ? 'careerPathCount-error' : 'careerPathCount-help'}
            onChange={(event) => onChange('careerPathCount', Number(event.target.value))}
          >
            {careerPathCounts.map((count) => <option key={count} value={count}>{count}{count === 5 ? ' paths (recommended)' : ' paths'}</option>)}
          </select>
          <small id="careerPathCount-help">Five is the default. Choose more for a wider set of recommendations and cards.</small>
          {errors.careerPathCount && <small className="field-error" id="careerPathCount-error">{errors.careerPathCount}</small>}
        </label>
        <label className={`assessment-select-field ${errors.indiaContext ? 'has-error' : ''}`} htmlFor="indiaContext">
          <span>Indian school board <span className="optional-label">(optional)</span></span>
          <select
            id="indiaContext"
            value={form.indiaContext}
            aria-invalid={Boolean(errors.indiaContext)}
            aria-describedby={errors.indiaContext ? 'indiaContext-error' : 'indiaContext-help'}
            onChange={(event) => onChange('indiaContext', event.target.value)}
          >
            <option value="">Choose if relevant</option>
            {indiaContextOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          <small id="indiaContext-help">For State board, add your state in the custom request if it matters.</small>
          {errors.indiaContext && <small className="field-error" id="indiaContext-error">{errors.indiaContext}</small>}
        </label>
        <label className={`assessment-select-field ${errors.indiaStudyStage ? 'has-error' : ''}`} htmlFor="indiaStudyStage">
          <span>Current Indian study stage <span className="optional-label">(optional)</span></span>
          <select
            id="indiaStudyStage"
            value={form.indiaStudyStage}
            aria-invalid={Boolean(errors.indiaStudyStage)}
            aria-describedby={errors.indiaStudyStage ? 'indiaStudyStage-error' : undefined}
            onChange={(event) => onChange('indiaStudyStage', event.target.value)}
          >
            <option value="">Choose if relevant</option>
            {indiaStudyStageOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          {errors.indiaStudyStage && <small className="field-error" id="indiaStudyStage-error">{errors.indiaStudyStage}</small>}
        </label>
      </div>

      <div className="assessment-question">
        <div className="assessment-question-title">
          <strong>What should your plan take into account?</strong>
          <small>Choose up to five. Examples help us make the plan practical and realistic.</small>
        </div>
        <CheckboxGroup
          options={practicalPriorityOptions}
          selected={form.practicalPriorities}
          onToggle={onTogglePriority}
          error={errors.practicalPriorities}
          label="Practical priorities for your career plan"
          maxSelections={5}
        />
      </div>

      <label className={`assessment-custom-request ${errors.customRequest ? 'has-error' : ''}`} htmlFor="customRequest">
        <span>Anything specific you want help with? <span className="optional-label">(optional)</span></span>
        <textarea
          id="customRequest"
          value={form.customRequest}
          maxLength={500}
          rows={4}
          aria-invalid={Boolean(errors.customRequest)}
          aria-describedby={errors.customRequest ? 'customRequest-error' : 'customRequest-help'}
          placeholder="For example: I am in Class 11 with PCB, exploring affordable healthcare careers that do not require NEET."
          onChange={(event) => onChange('customRequest', event.target.value)}
        />
        <small id="customRequest-help">{form.customRequest.length}/500 characters. Avoid sharing sensitive personal information.</small>
        {errors.customRequest && <small className="field-error" id="customRequest-error">{errors.customRequest}</small>}
      </label>
    </div>
  )
}

function ReviewRow({ label, value, onEdit, disabled }) {
  return <div className="review-row"><div><small>{label}</small><strong>{Array.isArray(value) ? value.join(', ') : value}</strong></div><button type="button" disabled={disabled} onClick={onEdit}>Edit</button></div>
}

function isCareerAnalysis(value, expectedCareerPathCount) {
  const isText = (item) => typeof item === 'string' && item.trim().length > 0
  const isTextList = (items, minimum, maximum) => (
    Array.isArray(items)
    && items.length >= minimum
    && items.length <= maximum
    && items.every(isText)
  )

  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== 4
    || !isText(value.summary)
    || !Array.isArray(value.careerSuggestions)
    || value.careerSuggestions.length < 3
    || value.careerSuggestions.length > 10
    || (expectedCareerPathCount !== undefined && value.careerSuggestions.length !== expectedCareerPathCount)
    || !Array.isArray(value.sixMonthRoadmap)
    || value.sixMonthRoadmap.length !== 6
    || !Array.isArray(value.beginnerProjects)
    || value.beginnerProjects.length !== 3) return false

  const careerTitles = new Set()
  for (const career of value.careerSuggestions) {
    if (!career || typeof career !== 'object' || Array.isArray(career)
      || Object.keys(career).length !== 4
      || !isText(career.title)
      || !isText(career.reasoning)
      || !isTextList(career.requiredSkills, 3, 6)
      || !Array.isArray(career.potentialSkillGaps)
      || career.potentialSkillGaps.length < 1
      || career.potentialSkillGaps.length > 4) return false

    const title = career.title.trim().toLowerCase()
    if (careerTitles.has(title)) return false
    careerTitles.add(title)

    for (const gap of career.potentialSkillGaps) {
      if (!gap || typeof gap !== 'object' || Array.isArray(gap)
        || Object.keys(gap).length !== 5
        || !isText(gap.skill)
        || !['high', 'medium', 'low'].includes(gap.importance)
        || !isText(gap.assessmentEvidence)
        || !isText(gap.whyItMatters)
        || !isText(gap.firstAction)) return false
    }
  }

  for (const [index, month] of value.sixMonthRoadmap.entries()) {
    if (!month || typeof month !== 'object' || Array.isArray(month)
      || Object.keys(month).length !== 5
      || month.month !== index + 1
      || !isText(month.focus)
      || !isTextList(month.learningGoals, 2, 5)
      || !isTextList(month.activities, 2, 5)
      || !isText(month.milestone)) return false
  }

  for (const project of value.beginnerProjects) {
    if (!project || typeof project !== 'object' || Array.isArray(project)
      || Object.keys(project).length !== 5
      || !isText(project.title)
      || !isText(project.description)
      || !isTextList(project.skillsPracticed, 2, 6)
      || !isText(project.deliverable)
      || !Number.isInteger(project.estimatedHours)
      || project.estimatedHours < 1
      || project.estimatedHours > 80) return false
  }

  return true
}

function AssessmentStep({ step, form, errors, onChange, onToggleInterest, onToggleStrength, onTogglePriority, onBack, onNext, onSubmit, onEditStep, status, apiError }) {
  const isReview = step === 4
  const isAnalyzing = status === 'loading'
  return (
    <section className="panel assessment-form" aria-busy={isAnalyzing}>
      <div className="form-progress"><span>STUDENT CAREER PROFILE</span><span>STEP {step + 1} OF {assessmentSteps.length}</span></div>
      <div className="assessment-progress-track" aria-label={`Step ${step + 1} of ${assessmentSteps.length}`}><span style={{ width: `${((step + 1) / assessmentSteps.length) * 100}%` }} /></div>
      <div className="step-indicators" aria-label="Assessment steps">{assessmentSteps.map((item, index) => <button type="button" key={item.title} className={`step-indicator ${index === step ? 'current' : ''} ${index < step ? 'complete' : ''}`} aria-current={index === step ? 'step' : undefined} disabled={index >= step || isAnalyzing} onClick={() => index < step && onEditStep(index)}><span>{index < step ? <Icon name="check" size={12} /> : index + 1}</span><small>{item.title}</small></button>)}</div>
      <div className="assessment-step-heading"><span className="eyebrow">STEP {String(step + 1).padStart(2, '0')}</span><h2>{assessmentSteps[step].title}</h2><p>{assessmentSteps[step].caption}</p></div>
      {step === 0 && <div className="assessment-fields-grid"><SelectField id="educationLevel" label="Where are you in your studies?" value={form.educationLevel} placeholder="Select your current stage" options={educationOptions} error={errors.educationLevel} onChange={onChange} /><SelectField id="studyArea" label="What are you studying?" value={form.studyArea} placeholder="Select an area of study" options={studyAreaOptions} error={errors.studyArea} onChange={onChange} /></div>}
      {step === 1 && <div className="assessment-question"><div className="assessment-question-title"><strong>Which areas spark your curiosity?</strong><small>Select all that sound interesting to you.</small></div><ChoiceCards options={interestOptions} selected={form.interests} onToggle={onToggleInterest} error={errors.interests} /></div>}
      {step === 2 && <div className="assessment-step-three"><div className="assessment-question"><div className="assessment-question-title"><strong>What strengths do you recognize in yourself?</strong><small>Select at least one. You can choose more than one.</small></div><CheckboxGroup options={strengthOptions} selected={form.strengths} onToggle={onToggleStrength} error={errors.strengths} label="Your strengths" /></div><SelectField id="workPriority" label="What matters most in a future career?" value={form.workPriority} placeholder="Choose your top priority" options={workPriorityOptions} error={errors.workPriority} onChange={onChange} /></div>}
      {step === 3 && <CustomizationStep form={form} errors={errors} onChange={onChange} onTogglePriority={onTogglePriority} />}
      {isReview && <div className="assessment-review">
        <div className="review-section">
          <div className="review-section-heading"><span>ABOUT YOU</span><button type="button" disabled={isAnalyzing} onClick={() => onEditStep(0)}>Edit</button></div>
          <ReviewRow label="Current study stage" value={form.educationLevel} disabled={isAnalyzing} onEdit={() => onEditStep(0)} />
          <ReviewRow label="Area of study" value={form.studyArea} disabled={isAnalyzing} onEdit={() => onEditStep(0)} />
        </div>
        <div className="review-section">
          <div className="review-section-heading"><span>YOUR INTERESTS</span><button type="button" disabled={isAnalyzing} onClick={() => onEditStep(1)}>Edit</button></div>
          <ReviewRow label="Areas that spark your curiosity" value={form.interests} disabled={isAnalyzing} onEdit={() => onEditStep(1)} />
        </div>
        <div className="review-section">
          <div className="review-section-heading"><span>YOUR STRENGTHS & PRIORITIES</span><button type="button" disabled={isAnalyzing} onClick={() => onEditStep(2)}>Edit</button></div>
          <ReviewRow label="Personal strengths" value={form.strengths} disabled={isAnalyzing} onEdit={() => onEditStep(2)} />
          <ReviewRow label="Career priority" value={form.workPriority} disabled={isAnalyzing} onEdit={() => onEditStep(2)} />
        </div>
        <div className="review-section">
          <div className="review-section-heading"><span>YOUR CUSTOM GUIDANCE</span><button type="button" disabled={isAnalyzing} onClick={() => onEditStep(3)}>Edit</button></div>
          <ReviewRow label="Indian school board" value={form.indiaContext || 'Not specified'} disabled={isAnalyzing} onEdit={() => onEditStep(3)} />
          <ReviewRow label="Current Indian study stage" value={form.indiaStudyStage || 'Not specified'} disabled={isAnalyzing} onEdit={() => onEditStep(3)} />
          <ReviewRow label="Practical priorities" value={form.practicalPriorities.length ? form.practicalPriorities : 'No additional priorities'} disabled={isAnalyzing} onEdit={() => onEditStep(3)} />
          <ReviewRow label="Number of career paths" value={`${form.careerPathCount} paths`} disabled={isAnalyzing} onEdit={() => onEditStep(3)} />
          <ReviewRow label="Your request" value={form.customRequest || 'No custom request'} disabled={isAnalyzing} onEdit={() => onEditStep(3)} />
        </div>
        <p className="review-privacy"><Icon name="check" size={15} /> Your answers are only used to personalize your career guidance.</p>
      </div>}
      {isAnalyzing && <div className="analysis-loading" role="status" aria-live="polite">
        <span className="loading-spinner" aria-hidden="true" />
        <span>Analyzing your answers and building your career plan…</span>
      </div>}
      {status === 'error' && <div className="api-error" role="alert">
        <p>{apiError}</p>
        <button type="button" className="button button-outline retry-analysis" disabled={isAnalyzing} onClick={onSubmit}>Retry analysis</button>
      </div>}
      <div className={`assessment-actions ${step === 0 ? 'actions-first-step' : ''}`}>
        {step > 0 && <button type="button" className="button button-outline" disabled={isAnalyzing} onClick={onBack}>Back</button>}
        {!isReview && <button type="button" className="button button-primary" onClick={onNext}>Continue <Icon name="arrow" size={16} /></button>}
        {isReview && status !== 'error' && <button type="button" className="button button-primary" disabled={isAnalyzing} onClick={onSubmit}>{isAnalyzing ? <><span className="loading-spinner" aria-hidden="true" /> Generating analysis…</> : <>Generate career analysis <Icon name="spark" size={16} /></>}</button>}
      </div>
      <p className="form-footnote">{isAnalyzing ? 'This may take a few seconds. Please keep this page open.' : 'Your progress is held here while you complete the assessment.'}</p>
    </section>
  )
}

function createEmptyAssessment() {
  return {
    step: 0,
    errors: {},
    analysis: null,
    assessmentId: null,
    status: 'idle',
    apiError: '',
    form: {
      educationLevel: '',
      studyArea: '',
      interests: [],
      strengths: [],
      workPriority: '',
      careerPathCount: 5,
      indiaContext: '',
      indiaStudyStage: '',
      practicalPriorities: [],
      customRequest: '',
    },
  }
}

function Assessment({ assessment, setAssessment }) {
  const requestInProgress = useRef(false)
  const { step, errors, form } = assessment
  const startNewAssessment = () => {
    setAssessment(createEmptyAssessment())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const updateField = (field, value) => {
    setAssessment((previous) => ({
      ...previous,
      form: { ...previous.form, [field]: value },
      errors: { ...previous.errors, [field]: '' },
      analysis: null,
      assessmentId: null,
      status: 'idle',
      apiError: '',
    }))
  }
  const toggleAnswer = (field, value) => {
    setAssessment((previous) => ({
      ...previous,
      form: {
        ...previous.form,
        [field]: previous.form[field].includes(value)
          ? previous.form[field].filter((item) => item !== value)
          : [...previous.form[field], value],
      },
      errors: { ...previous.errors, [field]: '' },
      analysis: null,
      assessmentId: null,
      status: 'idle',
      apiError: '',
    }))
  }
  const validateStep = () => {
    const validation = validateAssessmentForm(form)
    const nextErrors = Object.fromEntries(
      (requiredByStep[step] ?? [])
        .filter((field) => validation.errors[field])
        .map((field) => [field, validation.errors[field]]),
    )
    if (step === 3 && validation.errors.customRequest) {
      nextErrors.customRequest = validation.errors.customRequest
    }
    if (step === 3 && validation.errors.careerPathCount) {
      nextErrors.careerPathCount = validation.errors.careerPathCount
    }
    setAssessment((previous) => ({ ...previous, errors: nextErrors }))
    return Object.keys(nextErrors).length === 0
  }
  const goToStep = (nextStep) => {
    setAssessment((previous) => ({ ...previous, step: nextStep, status: 'idle', errors: {}, apiError: '', analysis: null, assessmentId: null }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleNext = () => {
    if (validateStep()) goToStep(step + 1)
  }
  const handleSubmit = async () => {
    if (requestInProgress.current) return

    const validation = validateAssessmentForm(form)
    if (Object.keys(validation.errors).length > 0) {
      setAssessment((previous) => ({
        ...previous,
        step: validation.step,
        status: 'idle',
        errors: validation.errors,
        apiError: '',
      }))
      return
    }

    requestInProgress.current = true
    setAssessment((previous) => ({ ...previous, status: 'loading', errors: {}, apiError: '' }))
    try {
      const response = await fetch('/api/analyze-career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      let result
      try {
        result = await response.json()
      } catch {
        throw new Error('The server returned an unreadable response. Please retry.')
      }
      if (!response.ok) {
        throw new Error(typeof result?.message === 'string' ? result.message : 'Career analysis could not be completed.')
      }
      if (!result || !isCareerAnalysis(result.analysis, form.careerPathCount)) {
        throw new Error('The server returned an invalid career analysis. Please try again.')
      }
      setAssessment((previous) => ({
        ...previous,
        status: 'success',
        errors: {},
        apiError: '',
        analysis: result.analysis,
        assessmentId: result.assessmentId,
      }))
    } catch (error) {
      setAssessment((previous) => ({
        ...previous,
        status: 'error',
        apiError: error instanceof TypeError
          ? 'Could not reach the career analysis service. Check your connection and make sure the backend is running, then retry.'
          : error instanceof Error ? error.message : 'An unexpected error occurred. Please retry.',
      }))
    } finally {
      requestInProgress.current = false
    }
  }

  if (assessment.status === 'success' && assessment.analysis) {
    return <CareerResultsDashboard analysis={assessment.analysis} onStartNewAssessment={startNewAssessment} />
  }

  return <>
    <PageHeading eyebrow="LET’S GET TO KNOW YOU" title="Your career, your terms." description="A few thoughtful answers help shape a plan that feels like yours." />
    <section className="assessment-layout">
      <AssessmentStep step={step} form={form} errors={errors} onChange={updateField} onToggleInterest={(value) => toggleAnswer('interests', value)} onToggleStrength={(value) => toggleAnswer('strengths', value)} onTogglePriority={(value) => toggleAnswer('practicalPriorities', value)} onBack={() => goToStep(step - 1)} onNext={handleNext} onSubmit={handleSubmit} onEditStep={goToStep} status={assessment.status} apiError={assessment.apiError} />
      <aside className="assessment-aside"><span className="aside-icon"><Icon name="spark" size={21} /></span><span className="eyebrow">A NOTE ON YOUR JOURNEY</span><h2>There’s no wrong direction.</h2><p>This isn’t a test, and there are no right answers. Think about what gives you energy and the kind of life you want your work to support.</p><div className="aside-divider" /><div className="aside-stat"><strong>4 steps</strong><span>at your own pace</span></div><div className="aside-stat"><strong>Just you</strong><span>your answers stay here</span></div></aside>
    </section>
  </>
}

function CareersPage({ navigate, analysis }) {
  if (!analysis) {
    return <>
      <PageHeading eyebrow="PERSONALIZED FROM YOUR ASSESSMENT" title="Career paths that fit" description="Your recommendations will be generated from your assessment answers." />
      <section className="panel saved-assessment-empty" role="status">
        <div><strong>No career recommendations yet</strong><p>Complete an assessment to get five or more career suggestions based on your interests and goals.</p></div>
        <button className="button button-outline" onClick={() => navigate('assessment')}>Start an assessment</button>
      </section>
    </>
  }
  return <><PageHeading eyebrow="PERSONALIZED FROM YOUR ASSESSMENT" title="Career paths that fit" description="These recommendations reflect the answers you shared in your assessment." ><span className="result-count">{analysis.careerSuggestions.length} AI recommendations</span></PageHeading><div className="career-intro"><span className="career-intro-icon"><Icon name="spark" size={19} /></span><span><strong>Your answers point to these directions.</strong><small>Each suggestion is based on your interests, strengths, and priorities.</small></span></div><section className="career-grid career-grid-page">{analysis.careerSuggestions.map((career) => <CareerRecommendationCard key={career.title} career={career} />)}</section><div className="explore-note"><Icon name="pin" size={18} /><span>Want to explore a different direction? <button onClick={() => navigate('assessment')}>Update your assessment</button> to explore what else could fit.</span></div></>
}

function SkillsPage({ navigate, analysis }) {
  if (!analysis) {
    return <>
      <PageHeading eyebrow="WHAT YOU BRING" title="Skills in focus" description="Required skills and potential gaps will be based on your generated career suggestions." />
      <section className="panel saved-assessment-empty" role="status">
        <div><strong>No skills profile yet</strong><p>Complete an assessment to see the skills required for your career paths and potential gaps to work on.</p></div>
        <button className="button button-outline" onClick={() => navigate('assessment')}>Start an assessment</button>
      </section>
    </>
  }
  return <>
    <PageHeading eyebrow="SKILLS TO EXPLORE" title="Skills in focus" description="Review the skills connected to each recommendation and the gaps your answers suggest exploring." ><button className="button button-outline" onClick={() => navigate('assessment')}><Icon name="clipboard" size={17} /> Refresh profile</button></PageHeading>
    <section className="career-grid career-grid-page" aria-label="Career skills and potential skill gaps">
      {analysis.careerSuggestions.map((career) => <article className="career-card ai-career-card" key={career.title}>
        <h3>{career.title}</h3>
        <div className="results-detail-column"><h3>Required skills</h3><ul className="results-skill-list">{career.requiredSkills.map((skill) => <li key={skill}>{skill}</li>)}</ul></div>
        <div className="results-detail-column results-gap-column"><h3>Potential skill gaps</h3>
          {career.potentialSkillGaps.length
            ? career.potentialSkillGaps.map((gap) => <article className="results-gap" key={gap.skill}><strong>{gap.skill}</strong><p>{gap.whyItMatters}</p><p className="results-gap-action"><strong>First step:</strong> {gap.firstAction}</p></article>)
            : <p>No specific skill gaps were identified from your answers.</p>}
        </div>
      </article>)}
    </section>
  </>
}

function RoadmapPage({ navigate, analysis }) {
  if (!analysis) {
    return <>
      <PageHeading eyebrow="SMALL STEPS, REAL MOMENTUM" title="Your learning roadmap" description="A practical six-month plan will be generated from your career suggestions." />
      <section className="panel saved-assessment-empty" role="status">
        <div><strong>No roadmap yet</strong><p>Complete an assessment to get a personalized six-month learning plan and beginner projects.</p></div>
        <button className="button button-outline" onClick={() => navigate('assessment')}>Start an assessment</button>
      </section>
    </>
  }
  return <>
    <PageHeading eyebrow="SMALL STEPS, REAL MOMENTUM" title="Your six-month roadmap" description="A flexible plan with learning goals, practical activities and milestones." ><button className="button button-outline" onClick={() => navigate('assessment')}><Icon name="clipboard" size={17} /> Refine your plan</button></PageHeading>
    <ol className="results-roadmap" aria-label="Six-month learning roadmap">
      {analysis.sixMonthRoadmap.map((month) => <li className="results-roadmap-month" key={month.month}>
        <div className="results-month-marker"><span>{String(month.month).padStart(2, '0')}</span></div>
        <article className="results-month-card">
          <div className="results-month-heading"><span>MONTH {month.month}</span><h3>{month.focus}</h3></div>
          <div className="results-month-content">
            <div><h4>Learning goals</h4><ul>{month.learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul></div>
            <div><h4>Activities</h4><ul>{month.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul></div>
          </div>
          <p className="results-month-milestone"><strong>Milestone</strong>{month.milestone}</p>
        </article>
      </li>)}
    </ol>
  </>
}

function App() {
  const [authStatus, setAuthStatus] = useState('loading')
  const [activePage, setActivePage] = useState('overview')
  const [authReturnPage, setAuthReturnPage] = useState('overview')
  const [authInitialMode, setAuthInitialMode] = useState('signup')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [storageMessage, setStorageMessage] = useState('')
  const [assessment, setAssessment] = useState(createEmptyAssessment)

  useEffect(() => {
    let active = true
    const restorePrivateWorkspace = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session')
        const session = await sessionResponse.json()
        if (!sessionResponse.ok) throw new Error(session.message || 'Account service is unavailable.')
        if (!active) return
        if (!session.authenticated) {
          setAuthStatus('guest')
          return
        }
        setAuthStatus('authenticated')
        const latestResponse = await fetch('/api/assessments/latest')
        const latest = await latestResponse.json()
        if (!latestResponse.ok) throw new Error(latest.message || 'Saved assessment could not be loaded.')
        if (!active) return
        if (latest.assessment && isCareerAnalysis(latest.assessment.analysis)) {
          setAssessment((previous) => ({
            ...previous,
            analysis: latest.assessment.analysis,
            assessmentId: latest.assessment.id,
            status: 'success',
          }))
        }
      } catch (error) {
        if (!active) return
        setAuthStatus('guest')
        setStorageMessage(error instanceof Error ? error.message : 'Account service is unavailable.')
      }
    }
    restorePrivateWorkspace()
    return () => { active = false }
  }, [])

  const navigate = useCallback((page) => {
    if (page === 'auth') {
      setAuthReturnPage('overview')
      setActivePage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (['assessment', 'careers', 'skills', 'roadmap', 'progress', 'feedback'].includes(page)
      && authStatus !== 'authenticated') {
      setAuthReturnPage(page)
      setActivePage('auth')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [authStatus])

  const finishAuthentication = useCallback(async () => {
    setAuthStatus('authenticated')
    setStorageMessage('')
    try {
      const response = await fetch('/api/assessments/latest')
      const result = await response.json()
      if (response.ok && result.assessment && isCareerAnalysis(result.assessment.analysis)) {
        setAssessment((previous) => ({
          ...previous,
          analysis: result.assessment.analysis,
          assessmentId: result.assessment.id,
          status: 'success',
        }))
      }
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Saved assessment could not be loaded.')
    }
    setActivePage(authReturnPage)
  }, [authReturnPage])

  const logout = async ({ switchAccount = false } = {}) => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Sign out could not be completed.')
      setAuthStatus('guest')
      setAssessment(createEmptyAssessment())
      setStorageMessage('')
      if (switchAccount) {
        setAuthReturnPage('overview')
        setAuthInitialMode('login')
        setActivePage('auth')
      } else {
        setAuthInitialMode('signup')
        setActivePage('overview')
      }
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'Sign out could not be completed.')
    }
  }

  const pageTitles = {
    overview: 'Home',
    assessment: 'My assessment',
    careers: 'Career paths',
    skills: 'Skills profile',
    roadmap: 'Learning roadmap',
    progress: 'Progress tracking',
    feedback: 'Feedback',
    auth: 'Your account',
  }
  return <div className="app-shell">
    <Sidebar activePage={activePage} onNavigate={navigate} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} authenticated={authStatus === 'authenticated'} onLogout={() => logout()} />
    <div className="main-shell">
      <Topbar
        onMenu={() => setMobileOpen(true)}
        query={query}
        setQuery={setQuery}
        authenticated={authStatus === 'authenticated'}
        activePage={activePage}
        onOpenAuth={() => navigate('auth')}
        onSwitchAccount={() => logout({ switchAccount: true })}
        onLogout={() => logout()}
      />
      {storageMessage && <p className="storage-message" role="alert">{storageMessage}</p>}
      <main className="main-content" key={activePage}>
        {activePage === 'overview' && <Overview navigate={navigate} query={query} analysis={assessment.analysis} />}
        {activePage === 'assessment' && <Assessment assessment={assessment} setAssessment={setAssessment} />}
        {activePage === 'careers' && <CareersPage navigate={navigate} analysis={assessment.analysis} />}
        {activePage === 'skills' && <SkillsPage navigate={navigate} analysis={assessment.analysis} />}
        {activePage === 'roadmap' && <RoadmapPage navigate={navigate} analysis={assessment.analysis} />}
        {activePage === 'progress' && <ProgressPage analysis={assessment.analysis} navigate={navigate} />}
        {activePage === 'feedback' && <FeedbackPage />}
        {activePage === 'auth' && <AuthPage key={authInitialMode} initialMode={authInitialMode} onAuthenticated={finishAuthentication} onBack={() => navigate('overview')} />}
      </main>
      <footer className="page-footer"><Brand /><span>A little more clarity, one step at a time.</span><span>© 2026 MargDarshak-AI</span></footer>
      <span className="sr-only" aria-live="polite">{pageTitles[activePage]}</span>
    </div>
  </div>
}

export default App
