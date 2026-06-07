import type { ReactNode } from "react";
import type { TabItem } from "../tabs/types";
import type {
  WorkspaceFixedPaneSlot,
  WorkspacePaneCapabilities,
  WorkspacePaneKind,
  WorkspacePaneModel,
  WorkspaceStartPageModel,
  WorkspaceWindowModel,
} from "./workspace-types";
import { createStartPageTab } from "./workspace-tab-utils";

const fixedLayoutPaneCapabilities: WorkspacePaneCapabilities = {
  canClose: false,
  canSplit: false,
  canResize: true,
  canCollapse: true,
};

const centerLayoutPaneCapabilities: WorkspacePaneCapabilities = {
  canClose: true,
  canSplit: true,
  canResize: true,
  canCollapse: false,
};

function createStartPage(
  id: string,
  title: string,
  panel: ReactNode,
): WorkspaceStartPageModel {
  return {
    id,
    title,
    panel,
  };
}

function createWorkspacePane(options: {
  id: string;
  title: string;
  kind: WorkspacePaneKind;
  capabilities: WorkspacePaneCapabilities;
  startPage: WorkspaceStartPageModel;
  initialTabs?: TabItem[];
  activeTabId?: string;
}): WorkspacePaneModel {
  const startTab = createStartPageTab(options.startPage);
  const items =
    options.initialTabs && options.initialTabs.length > 0
      ? options.initialTabs
      : [startTab];

  return {
    id: options.id,
    title: options.title,
    kind: options.kind,
    capabilities: options.capabilities,
    tabs: {
      startPage: options.startPage,
      items,
      activeTabId: options.activeTabId ?? items[0]?.id,
    },
  };
}

function createFixedPane(options: {
  slot: WorkspaceFixedPaneSlot;
  pane: WorkspacePaneModel;
  size: number;
  minSize: number;
  maxSize: number;
}) {
  return {
    slot: options.slot,
    collapsed: false,
    collapsedSize: 44,
    metrics: {
      size: options.size,
      minSize: options.minSize,
      maxSize: options.maxSize,
    },
    pane: options.pane,
  };
}

function NavigatorStartPanel() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Scene Navigator</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          This pane is reserved for scene trees, devices, and project-level
          navigation.
        </p>
      </div>

      <div className="grid gap-2">
        {["Recent Scenes", "Device Tree", "Configuration"].map((label) => (
          <div
            className="border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            key={label}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CenterStartPanel() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <div className="max-w-lg text-center">
        <p className="text-xs font-medium uppercase text-sky-600 dark:text-sky-400">
          Center Workbench
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Workspace Layout</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This first pass keeps the center as one layout pane. The split manager
          is modeled, but split controls are intentionally not exposed yet.
        </p>
      </div>
    </div>
  );
}

function CenterDemoPanel({
  title,
  description,
  stats,
}: {
  title: string;
  description: string;
  stats: Array<[string, string]>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <div
            className="border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            key={label}
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectorStartPanel() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Inspector</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          This pane is reserved for selected-item details, properties, and
          metadata.
        </p>
      </div>

      <dl className="grid gap-2 text-sm">
        {[
          ["Selection", "None"],
          ["Mode", "Layout"],
          ["Status", "Ready"],
        ].map(([label, value]) => (
          <div
            className="border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
            key={label}
          >
            <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function createDefaultWorkspace(): WorkspaceWindowModel {
  const leftPane = createWorkspacePane({
    id: "workspace-left-navigator",
    title: "Navigator",
    kind: "navigator",
    capabilities: fixedLayoutPaneCapabilities,
    startPage: createStartPage(
      "workspace-left-start",
      "Navigator",
      <NavigatorStartPanel />,
    ),
  });
  const centerPane = createWorkspacePane({
    id: "workspace-center-main",
    title: "Workbench",
    kind: "scene",
    capabilities: centerLayoutPaneCapabilities,
    startPage: createStartPage(
      "workspace-center-start",
      "Start",
      <CenterStartPanel />,
    ),
    initialTabs: [
      {
        id: "workspace-scene-tab",
        title: "Scene",
        closable: true,
        panel: (
          <CenterDemoPanel
            title="Main Scene"
            description="Scene content is a normal tab panel inside the center workspace."
            stats={[
              ["Devices", "128"],
              ["Status", "Online"],
              ["Mode", "Experiment"],
            ]}
          />
        ),
      },
      {
        id: "workspace-device-tab",
        title: "Device",
        closable: true,
        panel: (
          <CenterDemoPanel
            title="Camera Device"
            description="Right-click this tab and choose Split right to move it into a new pane."
            stats={[
              ["Temperature", "22.4 C"],
              ["Frames", "1,204"],
              ["Health", "Nominal"],
            ]}
          />
        ),
      },
      {
        id: "workspace-logs-tab",
        title: "Logs",
        closable: true,
        panel: (
          <CenterDemoPanel
            title="Runtime Logs"
            description="Logs are another center tab and can be split into their own pane."
            stats={[
              ["Warnings", "2"],
              ["Errors", "0"],
              ["Events", "341"],
            ]}
          />
        ),
      },
    ],
    activeTabId: "workspace-scene-tab",
  });
  const rightPane = createWorkspacePane({
    id: "workspace-right-inspector",
    title: "Inspector",
    kind: "inspector",
    capabilities: fixedLayoutPaneCapabilities,
    startPage: createStartPage(
      "workspace-right-start",
      "Inspector",
      <InspectorStartPanel />,
    ),
  });

  return {
    id: "workspace-main",
    title: "Workspace",
    header: {
      title: "Scientific Workspace",
      subtitle: "Resizable layout panes",
    },
    body: {
      paneManager: {
        left: createFixedPane({
          slot: "left",
          pane: leftPane,
          size: 280,
          minSize: 220,
          maxSize: 420,
        }),
        center: {
          slot: "center",
          metrics: {
            minSize: 360,
          },
          splitManager: {
            root: {
              type: "leaf",
              id: "workspace-center-leaf-main",
              pane: centerPane,
            },
            activeLeafId: "workspace-center-leaf-main",
          },
        },
        right: createFixedPane({
          slot: "right",
          pane: rightPane,
          size: 320,
          minSize: 240,
          maxSize: 460,
        }),
      },
    },
    footer: {
      status: "Ready",
      detail: "Layout mode",
    },
  };
}
