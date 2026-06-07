# Workspace Center Split Strategy

This feature adds split behavior only inside the center workspace area.

The outer workspace layout stays fixed:

```txt
WorkspaceBody
  └── PaneManager
        ├── LeftPane    resizable/collapsible, not splittable
        ├── CenterPane  owns center split tree
        └── RightPane   resizable/collapsible, not splittable
```

## Goal

The first user-facing action is:

```txt
Right-click a center tab
  -> Split Right
```

Before:

```txt
Center
└── Pane A
    └── Tabs: [Scene] [Device] [Logs]
```

After splitting `Device` right:

```txt
Center
└── SplitBranch horizontal
    ├── Pane A
    │   └── Tabs: [Scene] [Device] [Logs]
    └── Pane B
        └── Tabs: [Device]
```

The user sees the original pane and a right-side comparison view, but the model
remains a generic split tree.

## Boundaries

```txt
Tabs
  expose tab events, including right-click.
  do not know what Split Right means.

Center workspace pane
  owns the tab context menu.
  decides which actions are available.

Workspace center split action
  mutates the center split tree.
  opens another view of the selected tab in a new leaf pane.

Workspace model
  stores the resulting tree.
```

## Model Rule

Only center split leaves are splittable. A split action converts one leaf into a branch:

```txt
LeafPane
```

becomes:

```txt
SplitBranch horizontal
  first: original leaf pane
  second: new leaf pane
```

For `Split Right`, the original pane stays on the left and keeps the selected
tab active. The new right pane opens another view of that same tab.

## Split View Rule

When a tab is split right:

1. Find the source center leaf.
2. Find the selected tab inside that leaf's pane.
3. Ignore the action if the selected tab is the pane start page.
4. Create a new center leaf pane.
5. Open another view of the selected tab in the new pane.
6. Keep and activate the selected tab in the original pane.
7. Replace the original leaf with a horizontal split branch.

## First Implementation Scope

Implement only:

```txt
Right-click tab
  -> Split Right
```

Not yet:

```txt
Split Left
Split Down
Split Up
Resizable center split dividers
Closing split panes
Merging split panes
Dragging tabs between panes
```
