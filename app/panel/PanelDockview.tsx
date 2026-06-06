"use client";

import {
  DockviewReact,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import { useCallback } from "react";

type StarterPanelParams = {
  eyebrow: string;
  title: string;
  description: string;
  details: string[];
  accent: "blue" | "green" | "amber";
};

const accentStyles = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function StarterPanel({ params }: IDockviewPanelProps<StarterPanelParams>) {
  return (
    <section className="flex h-full flex-col gap-5 overflow-auto bg-white p-6 text-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${accentStyles[params.accent]}`}
          >
            {params.eyebrow}
          </p>
          <h2 className="mt-4 text-2xl font-semibold">{params.title}</h2>
        </div>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-zinc-600">
        {params.description}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {params.details.map((detail) => (
          <div
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700"
            key={detail}
          >
            {detail}
          </div>
        ))}
      </div>
    </section>
  );
}

const components = {
  starter: StarterPanel,
};

export function PanelDockview() {
  const handleReady = useCallback((event: DockviewReadyEvent) => {
    event.api.addPanel({
      id: "overview",
      title: "Overview",
      component: "starter",
      params: {
        eyebrow: "Panel",
        title: "Dockview panel",
        description:
          "This is the initial application surface mounted at the /panel route.",
        details: ["Route: /panel", "Status: ready", "Layout: dockable tabs"],
        accent: "blue",
      },
    });

    event.api.addPanel({
      id: "workspace",
      title: "Workspace",
      component: "starter",
      position: {
        direction: "right",
        referencePanel: "overview",
      },
      params: {
        eyebrow: "Workspace",
        title: "Starter workspace",
        description:
          "A second panel gives the dock layout something real to resize, tab, and move.",
        details: ["Drag tabs", "Resize groups", "Add real content next"],
        accent: "green",
      },
    });
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-100 text-zinc-950">
      <header className="flex min-h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
        <h1 className="text-sm font-semibold">Dockview Demo</h1>
        <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
          /panel
        </span>
      </header>
      <div className="dockview-theme-light min-h-0 flex-1">
        <DockviewReact components={components} onReady={handleReady} />
      </div>
    </div>
  );
}
