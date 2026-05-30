const express = require('express');
const router = express.Router();
const c = require('../controllers/hrDocument.controller');
const { protect, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.use(hrOnly);

router.get('/', c.getDocuments);
router.post('/', c.createDocument);
router.put('/:id', c.updateDocument);
router.delete('/:id', c.deleteDocument);

module.exports = router;
