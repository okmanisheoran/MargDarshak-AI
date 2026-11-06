import {
  DEFAULT_CAREER_PATH_COUNT,
  MAX_CAREER_PATH_COUNT,
  MIN_CAREER_PATH_COUNT,
} from '../services/careerAnalysisContract.js'

const educationLevels = [
  'High school',
  'College / undergraduate',
  'Graduate school',
  'Vocational or technical program',
  'Taking a gap year',
]

const studyAreas = [
  'Arts & humanities',
  'Business & economics',
  'Computer science & technology',
  'Education',
  'Engineering & mathematics',
  'Health & life sciences',
  'Social sciences',
  'Undecided / exploring',
]

const interests = [
  'Design & creativity',
  'Technology',
  'People & society',
  'Business & leadership',
  'Science & nature',
  'Writing & communication',
]

const strengths = [
  'Creative problem-solving',
  'Writing and communication',
  'Research and curiosity',
  'Teamwork and listening',
  'Planning and organization',
  'Numbers and analysis',
]

const workPriorities = [
  'Doing meaningful work',
  'Room to keep learning',
  'Creative freedom',
  'Job stability',
  'Flexible work and balance',
  'Making a positive impact',
]

const indiaContexts = [
  'CBSE',
  'CISCE (ICSE / ISC)',
  'State board',
  'NIOS / open schooling',
  'Other / not sure',
]

const indiaStudyStages = [
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

const practicalPriorities = [
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

function isChoice(value, choices) {
  return typeof value === 'string' && choices.includes(value)
}

function validateOptionalChoiceList(value, choices, field, errors) {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 5) {
    errors.push({ field, message: 'Choose no more than five options from the list.' })
    return []
  }
  if (value.some((item) => !isChoice(item, choices)) || new Set(value).size !== value.length) {
    errors.push({ field, message: 'One or more selected options are invalid.' })
  }
  return value
}

function validateChoiceList(value, choices, field, errors) {
  if (!Array.isArray(value) || value.length < 1 || value.length > choices.length) {
    errors.push({ field, message: 'Choose at least one valid option.' })
    return
  }

  if (value.some((item) => !isChoice(item, choices)) || new Set(value).size !== value.length) {
    errors.push({ field, message: 'One or more selected options are invalid.' })
  }
}

export function validateAssessment(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { data: null, errors: [{ field: 'body', message: 'A JSON object is required.' }] }
  }

  const errors = []
  if (!isChoice(input.educationLevel, educationLevels)) {
    errors.push({ field: 'educationLevel', message: 'Choose a valid education level.' })
  }
  if (!isChoice(input.studyArea, studyAreas)) {
    errors.push({ field: 'studyArea', message: 'Choose a valid area of study.' })
  }
  validateChoiceList(input.interests, interests, 'interests', errors)
  validateChoiceList(input.strengths, strengths, 'strengths', errors)
  if (!isChoice(input.workPriority, workPriorities)) {
    errors.push({ field: 'workPriority', message: 'Choose a valid career priority.' })
  }
  const careerPathCount = input.careerPathCount ?? DEFAULT_CAREER_PATH_COUNT
  if (!Number.isInteger(careerPathCount)
    || careerPathCount < MIN_CAREER_PATH_COUNT
    || careerPathCount > MAX_CAREER_PATH_COUNT) {
    errors.push({
      field: 'careerPathCount',
      message: `Choose between ${MIN_CAREER_PATH_COUNT} and ${MAX_CAREER_PATH_COUNT} career paths.`,
    })
  }
  if (input.indiaContext !== undefined && input.indiaContext !== '' && !isChoice(input.indiaContext, indiaContexts)) {
    errors.push({ field: 'indiaContext', message: 'Choose a valid Indian curriculum or study context.' })
  }
  if (input.indiaStudyStage !== undefined && input.indiaStudyStage !== '' && !isChoice(input.indiaStudyStage, indiaStudyStages)) {
    errors.push({ field: 'indiaStudyStage', message: 'Choose a valid Indian study stage.' })
  }
  const selectedPracticalPriorities = validateOptionalChoiceList(
    input.practicalPriorities,
    practicalPriorities,
    'practicalPriorities',
    errors,
  )
  let customRequest = ''
  if (input.customRequest !== undefined) {
    if (typeof input.customRequest !== 'string' || input.customRequest.length > 500) {
      errors.push({ field: 'customRequest', message: 'Your custom request must be 500 characters or fewer.' })
    } else {
      customRequest = input.customRequest.trim()
    }
  }

  if (errors.length > 0) return { data: null, errors }

  return {
    data: {
      educationLevel: input.educationLevel,
      studyArea: input.studyArea,
      interests: [...input.interests],
      strengths: [...input.strengths],
      workPriority: input.workPriority,
      careerPathCount,
      indiaContext: input.indiaContext ?? '',
      indiaStudyStage: input.indiaStudyStage ?? '',
      practicalPriorities: [...selectedPracticalPriorities],
      customRequest,
    },
    errors: [],
  }
}

export const assessmentChoices = {
  educationLevels,
  studyAreas,
  interests,
  strengths,
  workPriorities,
  indiaContexts,
  indiaStudyStages,
  practicalPriorities,
}
