import type { ReactNode } from "react";
import type { SplitWorkspaceItem } from "./type";

const kindLabel = {
  device: "Device",
  log: "Log",
  plot: "Plot",
  scene: "Scene",
};

export function renderSplitWorkspaceItem(item: SplitWorkspaceItem): ReactNode {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase text-sky-600 dark:text-sky-400">
          {kindLabel[item.kind]}
        </p>
        <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {item.description}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pane role</p>
          <p className="mt-1 font-medium">Independent tab controller</p>
        </div>
        <div className="border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">State</p>
          <p className="mt-1 font-medium">
            {item.dirty ? "Modified" : "Clean"}
          </p>
        </div>
      </div>
    </div>
  );
}
