import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Dataset } from "../lib/api";

export type InvestigationFilters = {
  businessProcess: string;
  severity: string;
  dataset: Dataset | "all";
  timeRange: "1h" | "6h" | "12h" | "24h" | "72h";
};

type InvestigationContextValue = {
  filters: InvestigationFilters;
  setFilters: Dispatch<SetStateAction<InvestigationFilters>>;
};

export const InvestigationContext = createContext<InvestigationContextValue | null>(null);

export function useInvestigationFilters() {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error("useInvestigationFilters must be used within InvestigationContext.Provider");
  }
  return context;
}
