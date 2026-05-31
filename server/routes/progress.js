const express = require('express')
const router = express.Router()
const db = require('../db')

// GET /api/progress/:userId
router.get('/:userId', (req, res) => {
  try {
    const progress = db.getProgress(req.params.userId)
    res.json({ progress })
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// POST /api/progress
router.post('/', (req, res) => {
  try {
    const { userId, moduleId, status } = req.body
    if (!userId || !moduleId || !status) {
      return res.status(400).json({ error: 'البيانات المطلوبة ناقصة' })
    }
    const validStatuses = ['not_started', 'in_progress', 'completed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' })
    }
    const record = db.upsertProgress({ userId, moduleId, status })
    res.json({ record })
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

module.exports = router
