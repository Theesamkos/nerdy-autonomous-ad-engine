import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CampaignBuilder from "./pages/CampaignBuilder";
import CampaignDetail from "./pages/CampaignDetail";
import AdversarialMode from "./pages/AdversarialMode";
import CreativeSpark from "./pages/CreativeSpark";
import PerformanceTracker from "./pages/PerformanceTracker";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/campaigns/new" component={CampaignBuilder} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/campaigns/:id/adversarial" component={AdversarialMode} />
      <Route path="/campaigns/:id/spark" component={CreativeSpark} />
      <Route path="/campaigns/:id/performance" component={PerformanceTracker} />
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
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: 'oklch(0.13 0.014 260)',
                border: '1px solid oklch(0.25 0.015 260)',
                color: 'oklch(0.96 0.005 260)',
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
