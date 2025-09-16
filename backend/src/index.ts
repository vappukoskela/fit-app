import express from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai';
import diaryRoutes from './routes/fooddiary';
import weightRoutes from './routes/weights';
import ingredientRoutes from './routes/ingredients';
import recipeRoutes from './routes/recipes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/chat', aiRoutes);
app.use('/api/diary', diaryRoutes)
app.use('/api/weights', weightRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/recipes', recipeRoutes)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
