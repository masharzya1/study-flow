import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { StudyProvider } from "@/contexts/StudyContext";
import { AppLayout } from "@/components/AppLayout";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import Dashboard from "@/pages/Dashboard";
import Subjects from "@/pages/Subjects";
import Timer from "@/pages/Timer";
import StudyPlan from "@/pages/StudyPlan";
import CalendarView from "@/pages/CalendarView";
import Revision from "@/pages/Revision";
import Analytics from "@/pages/Analytics";
import SettingsPage from "@/pages/Settings";
import NotFound from "./pages/NotFound";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { NotificationScheduler } from "@/components/NotificationScheduler";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <SwipeNavigation>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/plan" element={<StudyPlan />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/revision" element={<Revision />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SwipeNavigation>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StudyProvider>
        <Toaster />
        <Sonner />
        <NotificationPrompt />
        <BrowserRouter>
          <AppLayout>
            <AnimatedRoutes />
          </AppLayout>
        </BrowserRouter>
      </StudyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
