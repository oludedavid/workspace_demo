# Workspace Strategy

## Goal

Build a clean, reusable workspace feature for a modern browser-based scientific UI.

The workspace should feel like a professional application shell: structured, predictable, extensible, and suitable for complex models coming from APIs, XML parsing, scene trees, devices, logs, configuration views, and future runtime tools.

The important idea is to separate:

```txt
Workspace layout
Runtime panes
Tabs
Rendered views
Domain models
```

Tabs should not manage workspace layout.
Panes should not know how XML is parsed.
The workspace should only coordinate these layers.

---

## Core Workspace Structure

The user sees a full screen workspace window.

```txt
WorkspaceWindow
  ├── WorkspaceHeader
  ├── WorkspaceBody
  └── WorkspaceFooter
```

### WorkspaceWindow

The `WorkspaceWindow` represents the full visible screen for the user.

It owns the major screen regions:

```txt
WorkspaceWindow
  ├── Header
  ├── Body
  └── Footer
```

It should not directly manage all pane logic.
It should delegate the body layout to the `PaneManager`.

---

## Workspace Body Strategy

The `WorkspaceBody` is managed by the `PaneManager`.

The body contains exactly three outer layout panes:

```txt
WorkspaceBody
  └── PaneManager
        ├── LeftPane
        ├── CenterPane
        └── RightPane
```

These three panes are layout decisions.

They are fixed as the main workspace layout.

---

## Outer Pane Rules

The outer workspace body should only contain three panes:

```txt
LeftPane | CenterPane | RightPane
```

### LeftPane

The left pane is usually for navigation.

Examples:

- Scene navigator
- Device tree
- Project explorer
- Recent scenes
- Model browser

Rules:

```txt
LeftPane
  - resizable
  - collapsible
  - has tabs
  - not splittable
```

### RightPane

The right pane is usually for inspection and details.

Examples:

- Properties inspector
- Metadata
- Selected item details
- Logs summary
- Help/details panel

Rules:

```txt
RightPane
  - resizable
  - collapsible
  - has tabs
  - not splittable
```

### CenterPane

The center pane is the main working area.

Examples:

- Scene view
- Device view
- Plot view
- Configuration editor
- Runtime console
- Data viewer

Rules:

```txt
CenterPane
  - occupies remaining body space
  - participates in outer resize layout
  - owns a split manager
  - contains splittable inner panes
```

The center pane itself is not just one normal pane.
It owns the `CenterSplitManager`.

---

## Important Design Rule

Do not make every pane splittable.

The clean rule is:

```txt
Outer layout panes are resizable and collapsible.
Only center inner panes are splittable.
```

So:

```txt
LeftPane    -> not splittable
RightPane   -> not splittable
CenterPane  -> owns splittable inner panes
```

This keeps layout decisions separate from workspace content decisions.

---

## Center Split Strategy

The center area should be modeled as a split tree.

```txt
CenterPane
  └── CenterSplitManager
        └── SplitTree
```

The split tree can contain two kinds of nodes:

```txt
SplitNode
  ├── BranchNode
  └── LeafNode
```

### BranchNode

A branch node represents a split.

```txt
BranchNode
  - direction: horizontal | vertical
  - ratio: number
  - first: SplitNode
  - second: SplitNode
```

### LeafNode

A leaf node contains an actual workspace pane.

```txt
LeafNode
  - id
  - pane: WorkspacePane
```

Only leaf panes in the center can be split.

Example:

```txt
CenterSplitManager
  └── horizontal split
        ├── Scene Pane
        └── vertical split
              ├── Plot Pane
              └── Logs Pane
```

---

## WorkspacePane Strategy

A `WorkspacePane` is a runtime content container.

It can exist inside:

- the left layout pane
- the right layout pane
- a center split leaf

A workspace pane owns tabs.

```txt
WorkspacePane
  ├── PaneHeader
  └── Tabs
```

A pane is not the same as a layout column.

A pane is a content container.
A layout pane is a structural region.

---

## Pane Capabilities

Each pane should declare what it can do.

```ts
interface WorkspacePaneCapabilities {
  canClose: boolean;
  canSplit: boolean;
  canResize: boolean;
  canCollapse: boolean;
}
```

Recommended rules:

### Left and Right Layout Panes

```ts
{
  canClose: false,
  canSplit: false,
  canResize: true,
  canCollapse: true
}
```

### Center Leaf Panes

```ts
{
  canClose: true,
  canSplit: true,
  canResize: true,
  canCollapse: false
}
```

This makes behavior explicit instead of relying on assumptions.

---

## Tab Strategy

Tabs are reusable UI components.

Tabs should not know:

- where they are rendered
- whether the pane is left, center, or right
- whether the center is split
- whether the content came from XML, API, scene models, or manual React components

Tabs should only know:

```txt
items
activeTabId
onTabSelect
onTabClose
```

A tab item should look like:

```ts
interface TabItem {
  id: string;
  title: string;
  panel: React.ReactNode;
  closable?: boolean;
  dirty?: boolean;
  disabled?: boolean;
}
```

---

## Start Page Rule

Every feature that uses tabs should define a start page.

The start page is shown by default.

Example:

```txt
Scene workspace starts with:
[Start]
```

The start page could show:

- recent scenes
- quick actions
- project shortcuts
- search
- empty state
- onboarding help

### First Selection Rule

When the user selects the first real item, the first real tab replaces the start page.

```txt
Before:
[Start]

User clicks "XFEL Main Scene"

After:
[XFEL Main Scene]
```

### Later Selection Rule

After the first real tab exists, new tabs are appended in order.

```txt
[XFEL Main Scene]
[XFEL Main Scene] [Camera Device]
[XFEL Main Scene] [Camera Device] [Logs]
```

### Duplicate Rule

If the user opens an item that is already open, the system should select the existing tab instead of duplicating it.

```txt
Current:
[Scene A] [Logs]

User opens Scene A again

Result:
[Scene A] [Logs]
Scene A becomes active
```

### Restore Start Rule

If all real tabs are closed, the start page should return.

```txt
Before:
[Scene A]

User closes Scene A

After:
[Start]
```

---

## Runtime Cache Strategy

The workspace should support runtime caching because real content may come from:

```txt
Network request
  -> XML parsing
    -> domain models
      -> view models
        -> React views
```

Rendering should not require rebuilding everything unnecessarily.

A controller/cache layer can help.

```txt
Domain model
  -> adapter
    -> tab item
      -> cached rendered panel
```

The runtime cache should use:

```txt
model id + model version
```

If the version changes, rebuild the tab item.
If the version is the same, reuse the cached item.

---

## Adapter Strategy

Each feature should provide an adapter.

The adapter teaches the workspace how to turn domain models into tab items.

Example:

```ts
interface RuntimeTabsAdapter<TModel> {
  getId(model: TModel): string;
  getTitle(model: TModel): string;
  renderContent(model: TModel): React.ReactNode;

  getVersion?(model: TModel): string | number;
  getDirty?(model: TModel): boolean;
  getDisabled?(model: TModel): boolean;
  getClosable?(model: TModel): boolean;
}
```

This keeps the tab system generic.

The tab system does not need to know about:

- scenes
- devices
- XML
- plots
- logs
- configuration models

The feature-specific adapter handles that.

---

## Visitor Rendering Strategy

For complex models, use a visitor-style renderer.

Example:

```ts
function renderSceneNode(node: SceneNodeModel): React.ReactNode {
  switch (node.kind) {
    case "scene":
      return <SceneView node={node} />;

    case "device":
      return <DeviceView node={node} />;

    case "configuration":
      return <ConfigurationView node={node} />;

    case "log":
      return <LogView node={node} />;

    default:
      return <UnknownView node={node} />;
  }
}
```

This allows the feature to decide how each model kind should be displayed.

---

## Clean Data Flow

The ideal data flow is:

```txt
API / XML
  -> Parser
    -> Domain models
      -> Runtime controller
        -> Workspace pane tabs
          -> Tabs component
            -> Rendered panel
```

The UI should not parse XML.
The tab component should not inspect domain models.
The pane manager should not render scene-specific content directly.

Each layer should have one job.

---

## Proposed Model Types

```ts
export type WorkspaceId = string;
export type PaneId = string;
export type SplitNodeId = string;

export type WorkspacePaneSlot = "left" | "center" | "right";
export type SplitDirection = "horizontal" | "vertical";

export interface WorkspaceWindowModel {
  id: WorkspaceId;
  title: string;
  body: WorkspaceBodyModel;
}

export interface WorkspaceBodyModel {
  left: FixedLayoutPaneModel;
  center: CenterLayoutPaneModel;
  right: FixedLayoutPaneModel;
}

export interface FixedLayoutPaneModel {
  slot: "left" | "right";
  collapsed: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
  pane: WorkspacePaneModel;
}

export interface CenterLayoutPaneModel {
  slot: "center";
  splitRoot: CenterSplitNodeModel;
}

export type CenterSplitNodeModel =
  | CenterSplitLeafNodeModel
  | CenterSplitBranchNodeModel;

export interface CenterSplitLeafNodeModel {
  type: "leaf";
  id: SplitNodeId;
  pane: WorkspacePaneModel;
}

export interface CenterSplitBranchNodeModel {
  type: "split";
  id: SplitNodeId;
  direction: SplitDirection;
  ratio: number;
  first: CenterSplitNodeModel;
  second: CenterSplitNodeModel;
}

export interface WorkspacePaneModel {
  id: PaneId;
  title: string;
  kind: WorkspacePaneKind;
  tabs: WorkspacePaneTabsModel;
  capabilities: WorkspacePaneCapabilities;
}

export interface WorkspacePaneCapabilities {
  canClose: boolean;
  canSplit: boolean;
  canResize: boolean;
  canCollapse: boolean;
}

export interface WorkspacePaneTabsModel {
  items: TabItem[];
  activeTabId?: string;
}
```

---

## Main Components

Recommended component structure:

```txt
workspace/
  WorkspaceWindow.tsx
  WorkspaceHeader.tsx
  WorkspaceBody.tsx
  WorkspaceFooter.tsx

  PaneManager.tsx
  LayoutPaneShell.tsx

  CenterSplitManager.tsx
  CenterSplitArea.tsx
  CenterWorkspacePane.tsx

  workspace-types.ts
  workspace-factory.tsx
  workspace-actions.tsx
```

Tabs stay separate:

```txt
tabs/
  components/
    Tabs.tsx
    TabView.tsx
    TabGroup.tsx
    TabButtons.tsx
    TabPanel.tsx

  runtime/
    useRuntimeTabs.tsx

  types.ts
```

---

## Responsibility Breakdown

### WorkspaceWindow

Responsible for:

- full screen shell
- header/body/footer composition
- passing workspace model down

Not responsible for:

- tab rendering
- XML parsing
- split tree mutation details

### WorkspaceBody

Responsible for:

- arranging the main body
- delegating pane rendering to the pane manager

### PaneManager

Responsible for:

- managing exactly three outer panes
- left pane
- center pane
- right pane

### LeftPane / RightPane

Responsible for:

- showing tabs
- collapsing
- resizing

Not responsible for splitting.

### CenterSplitManager

Responsible for:

- rendering split tree
- splitting center leaf panes
- later resizing split branches

### CenterWorkspacePane

Responsible for:

- rendering pane header
- rendering pane tabs
- exposing split actions
- closing tabs in that pane

### Tabs

Responsible for:

- tab buttons
- active state
- panel rendering
- accessibility behavior

Not responsible for workspace layout.

---

## Key Workspace Operations

The system should support these operations:

```txt
openTabInLeftPane(tab)
openTabInRightPane(tab)
openTabInCenterPane(paneId, tab)

closeTabInPane(paneId, tabId)
selectTabInPane(paneId, tabId)

splitCenterLeaf(leafId, direction)
closeCenterLeaf(leafId)

toggleLeftPane()
toggleRightPane()

resizeLeftPane(width)
resizeRightPane(width)
resizeCenterSplit(splitId, ratio)

resetPaneToStartPage(paneId)
```

---

## First Implementation Phase

Build the static model and render it.

Scope:

```txt
- WorkspaceWindow
- WorkspaceHeader
- WorkspaceBody
- WorkspaceFooter
- Left / Center / Right layout
- Tabs inside each pane
- Center split tree model
- Center split rendering
```

Do not implement drag resizing first.
Use fixed widths and simple split ratios.

The goal of phase one is clarity.

---

## Second Implementation Phase

Add behavior.

Scope:

```txt
- open tab in pane
- close tab
- select tab
- start page replacement rule
- duplicate tab prevention
- restore start page when empty
- split center pane horizontally
- split center pane vertically
```

---

## Third Implementation Phase

Add resizing and polish.

Scope:

```txt
- resize left and right outer panes
- collapse left and right panes
- resize center split branches
- persist workspace layout
- restore workspace from saved state
```

---

## Fourth Implementation Phase

Add runtime/domain integration.

Scope:

```txt
- parse XML
- create domain models
- create adapters
- render views with visitor pattern
- runtime cache for tab panels
- invalidate cache when model version changes
```

---

## Recommended Rule Summary

```txt
1. WorkspaceWindow owns the screen.

2. WorkspaceBody is managed by PaneManager.

3. PaneManager owns exactly three outer layout panes:
   left, center, right.

4. Left and right panes are resizable and collapsible.
   They are not splittable.

5. Center pane owns a split tree.

6. Only center split leaf panes are splittable.

7. Every pane can own tabs.

8. Every tab feature starts with a start page.

9. The first real opened item replaces the start page.

10. Later opened items are appended in order.

11. Reopening an existing item selects it instead of duplicating it.

12. Closing the last real tab restores the start page.

13. Tabs are UI-only and should not know about workspace layout.

14. Domain models should be converted into tabs through adapters.

15. Complex model rendering should use a visitor-like renderContent layer.

16. Runtime cache should prevent unnecessary recreation of expensive views.
```

---

## Final Architecture Picture

```txt
WorkspaceWindow
  ├── WorkspaceHeader
  ├── WorkspaceBody
  │     └── PaneManager
  │           ├── LeftLayoutPane
  │           │     └── WorkspacePane
  │           │           └── Tabs
  │           │
  │           ├── CenterLayoutPane
  │           │     └── CenterSplitManager
  │           │           └── SplitTree
  │           │                 ├── CenterWorkspacePane
  │           │                 │     └── Tabs
  │           │                 └── CenterWorkspacePane
  │           │                       └── Tabs
  │           │
  │           └── RightLayoutPane
  │                 └── WorkspacePane
  │                       └── Tabs
  │
  └── WorkspaceFooter
```

---

## Final Direction

The workspace feature should be built as a small runtime system.

The UI components should remain simple and reusable.

The model should be explicit about capabilities.

The center split area should be its own system.

Tabs should remain focused on tab display and tab interaction.

This gives the application a clean path toward a serious Karabo-style scientific browser/workbench UI.
