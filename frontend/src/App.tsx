import { Dashboard } from "./components/Dashboard";
import { ThemeProvider } from "./theme/ThemeProvider"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Dashboard />
    </ThemeProvider>
  )
}

export default App;
