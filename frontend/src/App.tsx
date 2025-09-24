import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { MetricsGrid } from "./components/MetricsGrid";
import { ThreatLandscape } from "./components/ThreatLandscape";
import { LateralMovement } from "./components/LateralMovement";
import { Timeline } from "./components/Timeline";
import { InvestigationContext, type InvestigationFilters } from "./hooks/useInvestigationFilters";
import "./index.css";

const queryClient = new QueryClient();

function App() {
  const [filters, setFilters] = useState<InvestigationFilters>({
    businessProcess: "all",
    severity: "all",
    dataset: "all",
    timeRange: "24h"
  });

  const contextValue = useMemo(
    () => ({
      filters,
      setFilters
    }),
    [filters]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <InvestigationContext.Provider value={contextValue}>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <main className="relative flex flex-col gap-10 bg-gradient-to-b from-slate-950/90 via-slate-950 to-slate-950/90">
              <TopBar />
              <section className="px-6">
                <MetricsGrid />
              </section>
              <section className="px-6">
                <ThreatLandscape />
              </section>
              <section className="px-6">
                <LateralMovement />
              </section>
              <section className="px-6 pb-12">
                <Timeline />
              </section>
            </main>
          </div>
        </div>
      </InvestigationContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
