import Dashboard from "./pages/Dashboard.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { CHART_THEME } from "./theme.js";

export default function App() {
  const [theme, toggleTheme] = useTheme();
  return <Dashboard theme={theme} chart={CHART_THEME[theme]} onToggleTheme={toggleTheme} />;
}
