import { ThemeProvider } from './theme/ThemeProvider';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserPage from './Pages/UserPage';
import WeightPage from './Pages/WeightPage';
import Dashboard from './Pages/Dashboard';
import { Layout } from './Layout';
import { NutritionPage } from './Pages/NutritionPage';
import ActivityPage from './Pages/ActivityPage';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="user" element={<UserPage />} />
            <Route path="weight" element={<WeightPage />} />
            <Route path="nutrition" element={<NutritionPage />} />
            <Route path="activity" element={<ActivityPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App;