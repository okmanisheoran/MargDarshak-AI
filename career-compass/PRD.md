MargDarshak-AI
Product Requirements Document
What we are building, for whom, and how we will judge it
Status
Draft v1.0
Date
7 November 2026
Product
MargDarshak-AI, web app
Audience
Students in India (school and college)
1. Why this exists
Most students in India pick a stream, a degree or a first career direction with very little real information. The
advice they get tends to come from relatives, friends or whatever is trending, and personal counselling is
either hard to reach or expensive. Generic online quizzes usually end with a job title and nothing else.
MargDarshak-AI fills that gap. A student describes their interests, strengths and situation once, and gets
back a set of career options that explain themselves, plus a concrete plan for the next six months. The aim
is to give the student somewhere solid to start exploring, not to hand down a verdict.
2. Goals and non-goals
Goals
• A student can finish an assessment and see useful results in one sitting.
• Every suggestion comes with reasons, skills involved, gaps and first steps, so it can be acted on.
• Students can come back later: saved assessments and tracked progress.
• The results screen is built from what the AI returned, not from a fixed list of careers.
Non-goals
• No promise of admission, a job, a salary or success in any career. This is stated in the product.
• Not a replacement for a human counsellor, teacher or parent.
• No college search, entrance exam coaching, or job listings in this version.
• No counsellor marketplace or payments.
3. Who it is for
User
Situation
What they need
School student (class 9
to 12)
Choosing a stream or preparing
for entrance exams
Plain-language options, what each career actually
involves, what to study next
Undergraduate
Unsure the current course fits, or
looking for skills beyond the
syllabus
Skill gaps, a learning plan, small projects to build
Career switcher or
fresher
Has some background, wants a
new direction
Realistic paths from where they are now
Page 1
MargDarshak-AI  |  Product Requirements Document
4. What the product does
Requirements are grouped by priority. Must means the first release does not ship without it.
ID
Requirement
Priority
R1
Assessment form capturing interests, strengths and preferences, with optional Indian education
and career context (board, stream, current course, location preference, etc.)
Must
R2
Free-text field for personal instructions (for example, "I do not want a desk job")
Must
R3
Generate 5 career options by default; the student can choose any number from 5 to 10
Must
R4
For each career: why it may fit, skills it uses, likely skill gaps, practical first steps
Must
R5
Six-month learning roadmap and beginner-friendly project ideas
Must
R6
Dashboard renders the returned analysis dynamically; nothing about specific careers is
hardcoded
Must
R7
Sign up and sign in with email and password
Must
R8
Google sign-in, available only when configured on the server
Should
R9
Save assessments and view them later
Must
R10
Mark roadmap items as done and see progress
Must
R11
Submit feedback on a result
Should
R12
Sign out and switch accounts; each user sees only their own data
Must
R13
Visible disclaimer: suggestions are starting points, not guarantees
Must
R14
Works well on a phone screen
Must
R15
Re-run an assessment with edited answers and compare with the earlier one
Could
5. The main journey
1. Student lands on the home page and starts an assessment (sign-in is requested before results are
saved).
2. They answer the questions and, if they want, add context and personal instructions.
3. They pick how many careers they want to see (5 to 10).
4. The app shows a loading state while the analysis is generated, then opens the dashboard.
5. They read the careers, open the roadmap, and tick off the first steps over the following weeks.
6. Later they sign in again, find the saved assessment, and carry on from where they stopped.
6. How we will know it works
There is no usage history yet, so numeric targets will be set after the first batch of real users. What we will
measure from day one:
Measure
What it tells us
Assessment completion rate
Whether the form is too long or confusing
Share of results that are saved
Whether the output felt worth keeping
Return visits within 30 days
Whether students use it as a plan, not a one-off quiz
Page 2
MargDarshak-AI  |  Product Requirements Document
Measure
What it tells us
Roadmap items marked done
Whether the steps are realistic enough to attempt
Feedback ratings and comments
Quality of the AI output, and where it goes wrong
7. Risks
Risk
Why it matters
What we do about it
AI gives wrong or generic
advice
Students may act on it
Structured prompts with the student's own context, clear
disclaimer, feedback button to catch bad output
Output in the wrong shape
Dashboard would break
Validate the response against a schema and retry once
before showing an error
Sensitive data about young
users
Many users may be minors
Collect only what is needed, scope data per user, no data
selling, delete on request
Model cost and rate limits
Heavy use could stall the
app
Per-user rate limit, request timeout, cached saved results
Bias toward popular
careers
Narrow or stereotyped
suggestions
Prompt asks for varied options including non-obvious
ones; review feedback regularly
8. Later, not now
• Hindi and other regional languages.
• Exporting a result as a PDF to share with parents or teachers.
• Optional hand-off to a human counsellor.
• Pointers to relevant courses and free learning resources inside the roadmap.
9. Open questions
• What is the minimum age we allow, and do we need parental consent flows?
• How long should an assessment take: 5 minutes or 15?
• Do we keep saved results forever or let users delete them with one click?
• Which regions and languages come first after launch