"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Tabs from "../tabs/api";
import type { TabId } from "../tabs/types";
import { splitCenterTabToRight } from "./workspace-center-split-actions";
import { createDefaultWorkspace } from "./workspace-factory";
import {
  getFixedPaneSize,
  resizeFixedPane,
  selectTabInPane,
  toggleFixedPane,
  type WorkspaceResizeTarget,
} from "./workspace-layout";
import type {
  WorkspaceCenterSplitLeafNodeModel,
  WorkspaceCenterSplitNodeModel,
  WorkspaceFixedLayoutPaneModel,
  WorkspaceFixedPaneSlot,
  WorkspacePaneModel,
  WorkspaceWindowModel,
} from "./workspace-types";

interface CenterTabMenuState {
  leafId: string;
  tabId: TabId;
  x: number;
  y: number;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function WorkspacePaneTabs({
  pane,
  onTabContextMenu,
  onSelectTab,
}: {
  pane: WorkspacePaneModel;
  onTabContextMenu?: (
    tabId: TabId,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  onSelectTab: (paneId: string, tabId: TabId) => void;
}) {
  return (
    <Tabs
      activeTabId={pane.tabs.activeTabId}
      ariaLabel={`${pane.title} tabs`}
      className="flex-1"
      id={`${pane.id}-tabs`}
      items={pane.tabs.items}
      kind={pane.kind}
      onTabContextMenu={
        onTabContextMenu
          ? (_, tabId, event) => onTabContextMenu(tabId, event)
          : undefined
      }
      onTabSelect={(_, tabId) => onSelectTab(pane.id, tabId)}
    />
  );
}

function FixedLayoutPane({
  layoutPane,
  onSelectTab,
  onToggle,
}: {
  layoutPane: WorkspaceFixedLayoutPaneModel;
  onSelectTab: (paneId: string, tabId: TabId) => void;
  onToggle: (slot: WorkspaceFixedPaneSlot) => void;
}) {
  const { pane } = layoutPane;
  const isCollapsed = layoutPane.collapsed;

  return (
    <aside className="flex min-h-0 min-w-0 flex-col border-x border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-2 dark:border-zinc-800 dark:bg-zinc-950">
        {!isCollapsed ? (
          <h2 className="truncate text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            {pane.title}
          </h2>
        ) : null}

        <button
          aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${pane.title}`}
          className={cx(
            "flex h-7 w-7 shrink-0 items-center justify-center text-sm transition-colors",
            "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950",
            "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            isCollapsed && "mx-auto",
          )}
          onClick={() => onToggle(layoutPane.slot)}
          type="button"
        >
          {layoutPane.slot === "left"
            ? isCollapsed
              ? ">"
              : "<"
            : isCollapsed
              ? "<"
              : ">"}
        </button>
      </header>

      {isCollapsed ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <span className="text-[10px] font-medium uppercase text-zinc-400 [writing-mode:vertical-rl]">
            {pane.title}
          </span>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <WorkspacePaneTabs
            onSelectTab={onSelectTab}
            pane={pane}
          />
        </div>
      )}
    </aside>
  );
}

function ResizeHandle({
  disabled,
  label,
  onResizeStart,
}: {
  disabled: boolean;
  label: string;
  onResizeStart: () => void;
}) {
  return (
    <div
      aria-label={label}
      aria-orientation="vertical"
      className={cx(
        "w-2 shrink-0 bg-zinc-200 transition-colors dark:bg-zinc-800",
        disabled
          ? "cursor-default"
          : "cursor-col-resize hover:bg-sky-500 dark:hover:bg-sky-500",
      )}
      onPointerDown={(event) => {
        if (disabled) {
          return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        onResizeStart();
      }}
      role="separator"
    />
  );
}

function CenterLayoutPane({
  root,
  workspace,
  onWorkspaceChange,
  onSelectTab,
}: {
  root: WorkspaceCenterSplitNodeModel;
  workspace: WorkspaceWindowModel;
  onWorkspaceChange: (workspace: WorkspaceWindowModel) => void;
  onSelectTab: (paneId: string, tabId: TabId) => void;
}) {
  const [tabMenu, setTabMenu] = useState<CenterTabMenuState | null>(null);

  const closeMenu = () => setTabMenu(null);

  const handleSplitRight = () => {
    if (!tabMenu) {
      return;
    }

    onWorkspaceChange(
      splitCenterTabToRight(workspace, {
        sourceLeafId: tabMenu.leafId,
        tabId: tabMenu.tabId,
        createStartPage: (paneId) => ({
          id: `${paneId}-start`,
          title: "Start",
          panel: (
            <div className="flex h-full min-h-0 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              Empty split pane
            </div>
          ),
        }),
      }),
    );
    closeMenu();
  };

  return (
    <section className="relative h-full min-h-0 min-w-0 border-y border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <CenterSplitNodeView
        node={root}
        onSelectTab={onSelectTab}
        onTabContextMenu={(leaf, tabId, event) => {
          if (tabId === leaf.pane.tabs.startPage.id) {
            return;
          }

          event.preventDefault();
          setTabMenu({
            leafId: leaf.id,
            tabId,
            x: event.clientX,
            y: event.clientY,
          });
        }}
      />

      {tabMenu ? (
        <>
          <button
            aria-label="Close tab menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={closeMenu}
            type="button"
          />

          <div
            className="fixed z-50 min-w-40 border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            role="menu"
            style={{
              left: tabMenu.x,
              top: tabMenu.y,
            }}
          >
            <button
              className="block w-full px-3 py-2 text-left text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={handleSplitRight}
              role="menuitem"
              type="button"
            >
              Split right
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function CenterSplitNodeView({
  node,
  onSelectTab,
  onTabContextMenu,
}: {
  node: WorkspaceCenterSplitNodeModel;
  onSelectTab: (paneId: string, tabId: TabId) => void;
  onTabContextMenu: (
    leaf: WorkspaceCenterSplitLeafNodeModel,
    tabId: TabId,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
}) {
  if (node.type === "leaf") {
    return (
      <CenterWorkspacePane
        leaf={node}
        onSelectTab={onSelectTab}
        onTabContextMenu={onTabContextMenu}
      />
    );
  }

  const isHorizontal = node.direction === "horizontal";

  return (
    <div
      className="grid h-full min-h-0 min-w-0"
      style={{
        gridTemplateColumns: isHorizontal
          ? `${node.ratio}fr 6px ${1 - node.ratio}fr`
          : undefined,
        gridTemplateRows: isHorizontal
          ? undefined
          : `${node.ratio}fr 6px ${1 - node.ratio}fr`,
      }}
    >
      <CenterSplitNodeView
        node={node.first}
        onSelectTab={onSelectTab}
        onTabContextMenu={onTabContextMenu}
      />

      <div
        aria-hidden="true"
        className="bg-zinc-200 dark:bg-zinc-800"
      />

      <CenterSplitNodeView
        node={node.second}
        onSelectTab={onSelectTab}
        onTabContextMenu={onTabContextMenu}
      />
    </div>
  );
}

function CenterWorkspacePane({
  leaf,
  onSelectTab,
  onTabContextMenu,
}: {
  leaf: WorkspaceCenterSplitLeafNodeModel;
  onSelectTab: (paneId: string, tabId: TabId) => void;
  onTabContextMenu: (
    leaf: WorkspaceCenterSplitLeafNodeModel,
    tabId: TabId,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
}) {
  const { pane } = leaf;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="truncate text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
          {pane.title}
        </h2>
        {pane.capabilities.canSplit ? (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Splittable
          </span>
        ) : null}
      </header>

      <div className="min-h-0 flex-1">
        <WorkspacePaneTabs
          onSelectTab={onSelectTab}
          onTabContextMenu={(tabId, event) =>
            onTabContextMenu(leaf, tabId, event)
          }
          pane={pane}
        />
      </div>
    </section>
  );
}

export default function WorkspacePage() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState(createDefaultWorkspace);
  const [resizingTarget, setResizingTarget] =
    useState<WorkspaceResizeTarget | null>(null);

  const paneManager = workspace.body.paneManager;
  const leftWidth = getFixedPaneSize(paneManager.left);
  const rightWidth = getFixedPaneSize(paneManager.right);

  useEffect(() => {
    if (!resizingTarget) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const body = bodyRef.current;

      if (!body) {
        return;
      }

      const bounds = body.getBoundingClientRect();

      setWorkspace((currentWorkspace) =>
        resizeFixedPane(currentWorkspace, resizingTarget, event.clientX, bounds),
      );
    };

    const handlePointerUp = () => {
      setResizingTarget(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizingTarget]);

  return (
    <main className="flex h-dvh min-h-0 flex-col bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">
            {workspace.header.title}
          </h1>
          {workspace.header.subtitle ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {workspace.header.subtitle}
            </p>
          ) : null}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {workspace.title}
        </div>
      </header>

      <section
        className="grid min-h-0 flex-1 overflow-hidden"
        ref={bodyRef}
        style={{
          gridTemplateColumns: `${leftWidth}px 8px minmax(0, 1fr) 8px ${rightWidth}px`,
        }}
      >
        <FixedLayoutPane
          layoutPane={paneManager.left}
          onSelectTab={(paneId, tabId) => {
            setWorkspace((currentWorkspace) =>
              selectTabInPane(currentWorkspace, paneId, tabId),
            );
          }}
          onToggle={(slot) => {
            setWorkspace((currentWorkspace) =>
              toggleFixedPane(currentWorkspace, slot),
            );
          }}
        />

        <ResizeHandle
          disabled={paneManager.left.collapsed}
          label="Resize left pane"
          onResizeStart={() => setResizingTarget("left")}
        />

        <CenterLayoutPane
          onWorkspaceChange={setWorkspace}
          onSelectTab={(paneId, tabId) => {
            setWorkspace((currentWorkspace) =>
              selectTabInPane(currentWorkspace, paneId, tabId),
            );
          }}
          root={paneManager.center.splitManager.root}
          workspace={workspace}
        />

        <ResizeHandle
          disabled={paneManager.right.collapsed}
          label="Resize right pane"
          onResizeStart={() => setResizingTarget("right")}
        />

        <FixedLayoutPane
          layoutPane={paneManager.right}
          onSelectTab={(paneId, tabId) => {
            setWorkspace((currentWorkspace) =>
              selectTabInPane(currentWorkspace, paneId, tabId),
            );
          }}
          onToggle={(slot) => {
            setWorkspace((currentWorkspace) =>
              toggleFixedPane(currentWorkspace, slot),
            );
          }}
        />
      </section>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <span>{workspace.footer.status}</span>
        {workspace.footer.detail ? <span>{workspace.footer.detail}</span> : null}
      </footer>
    </main>
  );
}
