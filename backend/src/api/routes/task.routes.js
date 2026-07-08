const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/task.controller');
const { protect, authorize } = require('../../guards/auth.guard');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask); // any authenticated user can create tasks

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(authorize('ADMIN', 'SALES_MANAGER', 'OPERATION_MANAGER', 'HR', 'IT'), deleteTask);

module.exports = router;
