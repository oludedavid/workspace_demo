"use client";

import { useMemo, useSyncExternalStore } from "react";
import { TabController, type TabControllerAdapter } from "./tab-controller";

export function useCreateTabController<TModel>(
  adapter: TabControllerAdapter<TModel>,
) {
  return useMemo(() => {
    return new TabController<TModel>(adapter);
  }, [adapter]);
}

export function useTabControllerState<TModel>(
  controller: TabController<TModel>,
) {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
}
