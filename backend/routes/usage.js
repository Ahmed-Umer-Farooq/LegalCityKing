// Usage tracking endpoint
router.get('/usage', async (req, res) => {
  try {
    const { getLawyerUsage } = require('../middleware/usageTracker');
    const usage = await getLawyerUsage(req.user.id);
    res.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

module.exports = router;