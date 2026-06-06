"use client";

import { useMemo, useSyncExternalStore } from "react";
import { TabController, type TabControllerAdapter } from "./tab-controller";

export function useCreateTabController<TModel>(
  adapter: TabControllerAdapter<TModel>,
) {
  // Keep one controller instance for the lifetime of this adapter.
  return useMemo(() => {
    return new TabController<TModel>(adapter);
  }, [adapter]);
}

export function useTabControllerState<TModel>(
  controller: TabController<TModel>,
) {
  // Bridge the controller's subscribe/getSnapshot pair into React rendering.
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
}
