import { Router } from 'express';
import { generateText } from '../services/ai';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('Received prompt:', prompt);
    const text = await generateText(prompt);
    res.json({ text });
  } catch (err) {
    console.error('Error generating text:', err);
    res.status(500).json({ error: 'Failed to generate text' });
  }
});

export default router;