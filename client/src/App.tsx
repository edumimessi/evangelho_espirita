import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BibleReader from "./pages/BibleReader";
import DailyReading from "./pages/DailyReading";
import SearchPage from "./pages/Search";
import ReadingHistory from "./pages/ReadingHistory";
import Favorites from "./pages/Favorites";
import HomeGospel from "./pages/HomeGospel";
import Devocional from "./pages/Devocional";
import DiaryPage from "./pages/DiaryPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/biblia" component={BibleReader} />
      <Route path="/leitura-diaria" component={DailyReading} />
      <Route path="/busca" component={SearchPage} />
      <Route path="/historico" component={ReadingHistory} />
      <Route path="/favoritos" component={Favorites} />
      <Route path="/evangelho-no-lar" component={HomeGospel} />
      <Route path="/devocional" component={Devocional} />
      <Route path="/diario" component={DiaryPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
