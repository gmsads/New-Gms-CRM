const Team = require('../../domains/hr/team.model');
const User = require('../../domains/users/user.model');

exports.createTeam = async (req, res) => {
  try {
    const { name, department, manager, teamLeader, members } = req.body;
    if (!name || !manager) {
      return res.status(400).json({ success: false, message: 'Team name and manager are required.' });
    }

    const team = new Team({
      name,
      department: department || 'Sales',
      manager,
      teamLeader,
      members: members || [],
      createdBy: req.user._id
    });

    await team.save();
    
    // Populate for response
    await team.populate([
      { path: 'manager', select: 'name role' },
      { path: 'teamLeader', select: 'name role' },
      { path: 'members', select: 'name role' }
    ]);

    res.status(201).json({ success: true, data: team, message: 'Team created successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listTeams = async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true })
      .populate('manager', 'name role username')
      .populate('teamLeader', 'name role username')
      .populate('members', 'name role username')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, manager, teamLeader, members, isActive } = req.body;

    const team = await Team.findByIdAndUpdate(
      id,
      { name, department, manager, teamLeader, members, isActive },
      { new: true }
    ).populate([
      { path: 'manager', select: 'name role' },
      { path: 'teamLeader', select: 'name role' },
      { path: 'members', select: 'name role' }
    ]);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    res.json({ success: true, data: team, message: 'Team updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, message: 'Team deleted (deactivated) successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
