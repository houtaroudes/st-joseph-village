/* The consumer side of the buyer-path state.

   Kept out of villageState.jsx because the fast-refresh rule wants a file to
   export either components or plain functions and not both, and a provider
   that also exported its own hook tripped it. The context object lives here
   with the hook that reads it; the provider imports it from here.
   ============================================================ */

import { createContext, useContext } from "react";

/** How many lots the shortlist holds. Three compares; four is a spreadsheet. */
export const SHORTLIST_MAX = 3;

export const VillageContext = createContext(null);

export function useVillage() {
  const ctx = useContext(VillageContext);
  if (!ctx) throw new Error("useVillage must be used inside a VillageProvider");
  return ctx;
}
