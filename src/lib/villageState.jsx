/* ============================================================
   The buyer path's shared state.

   The four surfaces a purchase decision runs through used to be four
   islands. The plan knew about lots, the calculator knew about models, the
   form knew about neither, and the Homes cards linked to a calculator that
   ignored which card you had clicked. Everything they have to agree on
   lives here instead:

     selectedLotId    the lot open in the plan panel
     shortlist        up to three lots set aside to compare
     computeTargetId  the price the financing panel is showing

   Two of them outlive the tab. The open lot is mirrored into the URL, so a
   lot can be sent to somebody, and the shortlist is mirrored into
   localStorage, so it survives a reload. Both are read defensively: a query
   string and a storage bucket are untrusted input.

   The calculator's selection lives here rather than in the calculator on
   purpose. It has two writers (the select itself, and the Compute buttons on
   the plan and on the house models), and one owner means no effect is needed
   to reconcile them, which is what an effect doing that reconciliation would
   get wrong.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { LOT_BY_ID } from "./lots";
import { SHORTLIST_MAX, VillageContext } from "./useVillage";

const STORAGE_KEY = "sjv.shortlist";

/** A lot id from the query string, guaranteed to name a real lot. */
function readLotParam() {
  try {
    const id = new URL(window.location.href).searchParams.get("lot");
    return id && LOT_BY_ID[id] ? id : null;
  } catch {
    return null;
  }
}

/** The stored shortlist, filtered down to real lots and capped. */
function readStoredShortlist() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id, i) => typeof id === "string" && LOT_BY_ID[id] && parsed.indexOf(id) === i)
      .slice(0, SHORTLIST_MAX);
  } catch {
    // Private mode, a corrupt value, or storage refused outright. The
    // shortlist simply does not persist; nothing here is load bearing.
    return [];
  }
}

export function VillageProvider({ children }) {
  const [selectedLotId, setSelectedLotId] = useState(readLotParam);
  const [shortlist, setShortlist] = useState(readStoredShortlist);
  const [computeTargetId, setComputeTargetId] = useState(null);

  /* Mirror the open lot into the URL. replaceState, not pushState: opening a
     lot must not add a back-button entry, and it must not scroll, which is
     why the hash is carried through untouched. */
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedLotId) url.searchParams.set("lot", selectedLotId);
      else url.searchParams.delete("lot");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // A file:// or otherwise unusual origin. The lot still works for this
      // session, it just cannot be shared.
    }
  }, [selectedLotId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shortlist));
    } catch {
      // Storage refused. The shortlist stays usable, it just will not
      // survive the reload.
    }
  }, [shortlist]);

  const selectLot = useCallback((id) => {
    setSelectedLotId((prev) => (prev === id ? prev : id));
  }, []);

  const clearSelection = useCallback(() => setSelectedLotId(null), []);

  const toggleShortlist = useCallback((id) => {
    if (!LOT_BY_ID[id]) return;
    setShortlist((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= SHORTLIST_MAX) return prev;
      return [...prev, id];
    });
  }, []);

  const clearShortlist = useCallback(() => setShortlist([]), []);

  /* One setter for both writers: the calculator's own select, and the Compute
     buttons that hand a price over from somewhere else on the page. */
  const computeFor = useCallback((id) => setComputeTargetId(id), []);

  const value = useMemo(() => {
    const shortlistLots = shortlist.map((id) => LOT_BY_ID[id]).filter(Boolean);
    return {
      selectedLotId,
      selectedLot: selectedLotId ? LOT_BY_ID[selectedLotId] || null : null,
      selectLot,
      clearSelection,
      shortlist,
      shortlistLots,
      toggleShortlist,
      clearShortlist,
      computeTargetId,
      computeFor,
    };
  }, [
    selectedLotId,
    selectLot,
    clearSelection,
    shortlist,
    toggleShortlist,
    clearShortlist,
    computeTargetId,
    computeFor,
  ]);

  return <VillageContext.Provider value={value}>{children}</VillageContext.Provider>;
}
