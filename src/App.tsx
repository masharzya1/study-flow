import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { StudyProvider } from "@/contexts/StudyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { SwipeNavigation } from "@/components/SwipeNavigation";
import { OnboardingTour } from "@/components/OnboardingTour";
import { InstallPrompt } from "@/components/InstallPrompt";
import { SplashScreen } from "@/components/SplashScreen";
import Dashboard from "@/pages/Dashboard";
import Subjects from "@/pages/Subjects";
import Timer from "@/pages/Timer";
import StudyPlan from "@/pages/StudyPlan";
import CalendarView from "@/pages/CalendarView";
import Revision from "@/pages/Revision";
import Analytics from "@/pages/Analytics";
import SettingsPage from "@/pages/Settings";
import Files from "@/pages/Files";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Admin from "@/pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <SwipeNavigation>
      <SplashScreen />
      <OnboardingTour />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/plan" element={<StudyPlan />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/revision" element={<Revision />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/files" element={<Files />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SwipeNavigation>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <StudyProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <InstallPrompt />
                <AppLayout>
                  <AnimatedRoutes />
                </AppLayout>
              </BrowserRouter>
            </StudyProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
