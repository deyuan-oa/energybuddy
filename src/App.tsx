import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/contexts/ChatContext";
import { AppShell } from "@/components/AppShell";
import { CommandPalette } from "@/components/CommandPalette";
import Index from "./pages/Index";
import DailyGuide from "./pages/DailyGuide";
import Actions from "./pages/Actions";
import KpiPanel from "./pages/KpiPanel";
import Reports from "./pages/Reports";
import Compliance from "./pages/Compliance";
import Settings from "./pages/Settings";
import Savings from "./pages/Savings";
import CarbonFootprint from "./pages/CarbonFootprint";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ChatProvider>
          <CommandPalette />
          <AppShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/daily-guide" element={<DailyGuide />} />
              <Route path="/actions" element={<Actions />} />
              <Route path="/kpis" element={<KpiPanel />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/carbon" element={<CarbonFootprint />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </ChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
