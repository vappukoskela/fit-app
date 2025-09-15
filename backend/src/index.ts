import express from 'express';
import cors from 'cors';
import openaiRoutes from './routes/openai';
import diaryRoutes from './routes/fooddiary';
import weightRoutes from './routes/weights';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/openai', openaiRoutes);
app.use('/api/diary', diaryRoutes)
app.use('/api/weights', weightRoutes)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
