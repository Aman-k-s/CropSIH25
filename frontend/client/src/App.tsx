import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/hooks/useTranslation";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import { FarmProvider } from "@/context/FarmContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}




function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <TooltipProvider>
          <FarmProvider> {/* ✅ Wrap here */}
            <Toaster />
            <Router />
          </FarmProvider>
        </TooltipProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}


export default App;