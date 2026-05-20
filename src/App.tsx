import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { TunnelRootRedirect } from "@/components/TunnelRootRedirect";
import { I18nProvider } from "@/i18n/useI18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteAccessGuard } from "@/components/SiteAccessGuard";
import Index from "./pages/Index";
import About from "./pages/About";
import Demo from "./pages/Demo";
import StudioHubIndex, { StudioHubDashboard, StudioHubLogin } from "./pages/StudioHub";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { LanguageProvider } from "@/i18n/LanguageContext";

const ClassicStudio = lazy(() => import("./pages/ClassicStudio"));

function ClassicStudioLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <KeyboardShortcuts />
            <BrowserRouter>
              <TunnelRootRedirect />
              <Routes>
                <Route path="/demo" element={<Demo />} />
                <Route path="/studio" element={<StudioHubIndex />} />
                <Route path="/studio/login" element={<StudioHubLogin />} />
                <Route path="/studio/dashboard" element={<StudioHubDashboard />} />
                <Route element={<SiteAccessGuard><Outlet /></SiteAccessGuard>}>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/about" element={<About />} />
                  <Route
                    path="/classic"
                    element={
                      <LanguageProvider>
                        <Suspense fallback={<ClassicStudioLoading />}>
                          <ClassicStudio />
                        </Suspense>
                      </LanguageProvider>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
