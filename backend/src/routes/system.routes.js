import express from 'express';
const router = express.Router();
router.post('/shutdown', (req, res) => {
  res.json({ message: 'Đang tắt Web Local Server. Tạm biệt!' });
  setTimeout(() => process.exit(0), 1000);
});
export default router;