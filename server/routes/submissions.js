const express = require('express')
const router = express.Router()
const db = require('../db')

// POST /api/submissions
router.post('/', (req, res) => {
  try {
    const { userId, moduleId, content, taskTrack } = req.body
    if (!userId || !moduleId || !content) {
      return res.status(400).json({ error: 'البيانات المطلوبة ناقصة' })
    }
    const submission = db.createSubmission({ userId, moduleId, content, taskTrack })
    // Auto-mark module as completed
    db.upsertProgress({ userId, moduleId, status: 'completed' })
    res.json({ submission, message: 'تم تسليم المهمة بنجاح' })
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// GET /api/submissions/:userId
router.get('/:userId', (req, res) => {
  try {
    const submissions = db.getSubmissions(req.params.userId)
    res.json({ submissions })
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// GET /api/submissions/:userId/:moduleId
router.get('/:userId/:moduleId', (req, res) => {
  try {
    const submissions = db.getSubmissionByModule(req.params.userId, req.params.moduleId)
    res.json({ submissions })
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

module.exports = router
