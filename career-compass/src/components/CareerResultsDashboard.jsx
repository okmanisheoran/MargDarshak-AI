import { useState } from 'react'
import './CareerResultsDashboard.css'

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="results-section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}

function CareerRecommendationCard({ career, index }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <article className={`results-career-card ${flipped ? 'is-flipped' : ''}`}>
      <div className="results-career-flip-inner">
        <div className="results-career-face results-career-front">
          <span className="results-career-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="results-career-kicker">CAREER DIRECTION</span>
          <h3>{career.title}</h3>
          <button type="button" className="results-career-action" aria-expanded={flipped} onClick={() => setFlipped(true)}>
            Hover or select to explore <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="results-career-face results-career-back" aria-hidden={!flipped}>
          <div className="results-career-back-heading"><span>WHY IT COULD FIT</span><button type="button" tabIndex={flipped ? 0 : -1} aria-label={`Return to ${career.title}`} onClick={() => setFlipped(false)}>Back</button></div>
          <p className="results-career-reasoning">{career.reasoning}</p>
          <div className="results-career-details">
            <div className="results-detail-column">
              <h4>Skills to explore</h4>
              <ul className="results-skill-list">{career.requiredSkills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
            </div>
            <div className="results-detail-column results-gap-column">
              <h4>Potential skills to build</h4>
              {career.potentialSkillGaps.map((gap) => <article className="results-gap" key={gap.skill}>
                <div className="results-gap-heading">
                  <strong>{gap.skill}</strong>
                  <span className={`results-gap-priority priority-${gap.importance}`}>{gap.importance} priority</span>
                </div>
                <p>{gap.whyItMatters}</p>
                <p className="results-gap-action"><strong>First step:</strong> {gap.firstAction}</p>
              </article>)}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function CareerRecommendations({ careers }) {
  return (
    <section className="results-section" aria-labelledby="results-careers-heading">
      <SectionHeading
        eyebrow={`${careers.length} DIRECTIONS TO EXPLORE`}
        title="Career recommendations"
        description="Each path connects your assessment answers to relevant skills and practical areas to grow."
      />
      <div className="results-career-list" id="results-careers-heading">
        {careers.map((career, index) => <CareerRecommendationCard
          career={career}
          index={index}
          key={career.title}
        />)}
      </div>
    </section>
  )
}

function RoadmapTimeline({ months }) {
  return (
    <section className="results-section" aria-labelledby="results-roadmap-heading">
      <SectionHeading
        eyebrow="A FLEXIBLE PLAN, AT YOUR PACE"
        title="Your six-month roadmap"
        description="Build knowledge step by step, with achievable goals and a clear milestone each month."
      />
      <ol className="results-roadmap" id="results-roadmap-heading">
        {months.map((month) => <li className="results-roadmap-month" key={month.month}>
          <div className="results-month-marker"><span>{String(month.month).padStart(2, '0')}</span></div>
          <article className="results-month-card">
            <div className="results-month-heading">
              <span>MONTH {month.month}</span>
              <h3>{month.focus}</h3>
            </div>
            <div className="results-month-content">
              <div>
                <h4>Learning goals</h4>
                <ul>{month.learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
              </div>
              <div>
                <h4>Activities</h4>
                <ul>{month.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
              </div>
            </div>
            <p className="results-month-milestone"><strong>Milestone</strong>{month.milestone}</p>
          </article>
        </li>)}
      </ol>
    </section>
  )
}

function BeginnerProjects({ projects }) {
  return (
    <section className="results-section" aria-labelledby="results-projects-heading">
      <SectionHeading
        eyebrow="LEARN BY MAKING"
        title="Beginner projects"
        description="Practical ways to try out your new skills and create something you can reflect on."
      />
      <div className="results-project-grid" id="results-projects-heading">
        {projects.map((project, index) => <article className="results-project-card" key={project.title}>
          <span className="results-project-number">PROJECT {String(index + 1).padStart(2, '0')}</span>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div className="results-project-skills">
            <h4>Skills practiced</h4>
            <ul>{project.skillsPracticed.map((skill) => <li key={skill}>{skill}</li>)}</ul>
          </div>
          <p className="results-project-deliverable"><strong>Deliverable</strong>{project.deliverable}</p>
          <span className="results-project-time">{project.estimatedHours} estimated hours</span>
        </article>)}
      </div>
    </section>
  )
}

export default function CareerResultsDashboard({ analysis, onStartNewAssessment }) {
  return (
    <div className="career-results-dashboard">
      <header className="results-hero">
        <div className="results-hero-copy">
          <span className="eyebrow">YOUR PERSONALIZED CAREER COMPASS</span>
          <h1>Your next chapter starts here.</h1>
          <p>{analysis.summary}</p>
        </div>
        <button className="button button-outline results-new-assessment" type="button" onClick={onStartNewAssessment}>
          Start a new assessment
        </button>
        <div className="results-overview-stats" aria-label="Your career plan at a glance">
          <div><strong>{analysis.careerSuggestions.length}</strong><span>career directions</span></div>
          <div><strong>{analysis.sixMonthRoadmap.length}</strong><span>months to explore</span></div>
          <div><strong>{analysis.beginnerProjects.length}</strong><span>beginner projects</span></div>
        </div>
      </header>

      <CareerRecommendations careers={analysis.careerSuggestions} />
      <RoadmapTimeline months={analysis.sixMonthRoadmap} />
      <BeginnerProjects projects={analysis.beginnerProjects} />

      <footer className="results-footer-note">
        <strong>A direction, not a deadline.</strong>
        <span>Use this plan as a flexible starting point. Your interests and goals can change as you learn.</span>
      </footer>
    </div>
  )
}
