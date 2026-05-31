const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/trust_lms.json')

const defaultSchema = {
  users: [],
  progress: [],
  submissions: [],
}

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultSchema, null, 2))
      return { ...defaultSchema }
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { ...defaultSchema }
  }
}

function writeDb(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

const db = {
  // Users
  createUser({ name, department }) {
    const data = readDb()
    const existing = data.users.find(u => u.name === name && u.department === department)
    if (existing) return existing
    const user = { id: uuidv4(), name, department, createdAt: new Date().toISOString() }
    data.users.push(user)
    writeDb(data)
    return user
  },

  getUserById(id) {
    const data = readDb()
    return data.users.find(u => u.id === id) || null
  },

  // Progress
  getProgress(userId) {
    const data = readDb()
    return data.progress.filter(p => p.userId === userId)
  },

  upsertProgress({ userId, moduleId, status }) {
    const data = readDb()
    const idx = data.progress.findIndex(p => p.userId === userId && p.moduleId === moduleId)
    const record = {
      userId,
      moduleId,
      status,
      updatedAt: new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : null,
    }
    if (idx >= 0) {
      data.progress[idx] = { ...data.progress[idx], ...record }
    } else {
      data.progress.push(record)
    }
    writeDb(data)
    return record
  },

  // Submissions
  createSubmission({ userId, moduleId, content, taskTrack }) {
    const data = readDb()
    const submission = {
      id: uuidv4(),
      userId,
      moduleId,
      content,
      taskTrack: taskTrack || null,
      submittedAt: new Date().toISOString(),
    }
    data.submissions.push(submission)
    writeDb(data)
    return submission
  },

  getSubmissions(userId) {
    const data = readDb()
    return data.submissions.filter(s => s.userId === userId)
  },

  getSubmissionByModule(userId, moduleId) {
    const data = readDb()
    return data.submissions.filter(s => s.userId === userId && s.moduleId === moduleId)
  },
}

module.exports = db
