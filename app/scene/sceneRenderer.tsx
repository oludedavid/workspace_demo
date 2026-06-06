"use client";

import type { ReactNode } from "react";
import type { SceneNodeModel } from "./type";

function DeviceView({ node }: { node: SceneNodeModel }) {
  const payload = node.payload as {
    status?: string;
    temperature?: string;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{node.name}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Status</p>
          <p className="mt-1 font-medium text-emerald-600">
            {payload.status ?? "Unknown"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Temperature</p>
          <p className="mt-1 font-medium">{payload.temperature ?? "-"}</p>
        </div>
      </div>
    </div>
  );
}

function PropertyView({ node }: { node: SceneNodeModel }) {
  const payload = node.payload as {
    sampleRate?: string;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{node.name}</h2>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm font-medium">Sample rate</label>

        <input
          className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950"
          defaultValue={payload.sampleRate ?? ""}
        />
      </div>
    </div>
  );
}

function LogView({ node }: { node: SceneNodeModel }) {
  const payload = node.payload as {
    lines?: string[];
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{node.name}</h2>

      <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100">
        {(payload.lines ?? []).join("\n")}
      </pre>
    </div>
  );
}

function UnknownView({ node }: { node: SceneNodeModel }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
      No view registered for node kind: <strong>{node.kind}</strong>
    </div>
  );
}

export function renderSceneNode(node: SceneNodeModel): ReactNode {
  switch (node.kind) {
    case "device":
      return <DeviceView node={node} />;

    case "property":
      return <PropertyView node={node} />;

    case "log":
      return <LogView node={node} />;

    default:
      return <UnknownView node={node} />;
  }
}
