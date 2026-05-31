const express = require('express')
const router = express.Router()
const db = require('../db')

// POST /api/auth/login — create or retrieve user session
router.post('/login', (req, res) => {
  try {
    const { name, department } = req.body
    if (!name || !department) {
      return res.status(400).json({ error: 'الاسم والقسم مطلوبان' })
    }
    const user = db.createUser({ name: name.trim(), department: department.trim() })
    const progress = db.getProgress(user.id)
    const completedCount = progress.filter(p => p.status === 'completed').length
    res.json({ user, progress, completedCount })
  } catch (err) {
    console.error('Auth error:', err)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// GET /api/auth/user/:id
router.get('/user/:id', (req, res) => {
  try {
    const user = db.getUserById(req.params.id)
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' })
    const progress = db.getProgress(user.id)
    res.json({ user, progress })
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

module.exports = router
