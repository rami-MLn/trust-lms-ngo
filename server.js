const express = require('express')
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const fs = require('fs')

require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(compression())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

// Routes
const progressRoutes = require('./server/routes/progress')
const submissionsRoutes = require('./server/routes/submissions')
const authRoutes = require('./server/routes/auth')

app.use('/api/auth', authRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/submissions', submissionsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TRUST LMS API is running', timestamp: new Date().toISOString() })
})

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 TRUST LMS Server running on port ${PORT}`)
})

module.exports = app
