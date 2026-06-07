# Workspace Strategy

This feature is a workspace system, not another tab experiment. The goal is to model the user's full screen as a workspace window with a fixed outer layout and a splittable center workbench.

## Structure

```txt
WorkspaceWindow
  ├── WorkspaceHeader
  ├── WorkspaceBody
  │     └── PaneManager
  │           ├── LeftPane      fixed layout pane, resizable/collapsible, not splittable
  │           ├── CenterPane    resizable layout region, owns splittable inner panes
  │           └── RightPane     fixed layout pane, resizable/collapsible, not splittable
  └── WorkspaceFooter
```

## Separation Rule

```txt
Outer panes = layout structure
Inner center panes = split workspace structure
Tabs = content structure
Tab panels = rendered views
```

Do not make every pane splittable. The outer left, center, and right panes are layout decisions. Splitting belongs only inside the center pane.

## Pane Rules

```txt
Left pane:
  Has tabs.
  Can collapse.
  Can resize.
  Cannot split.

Right pane:
  Has tabs.
  Can collapse.
  Can resize.
  Cannot split.

Center pane:
  Can resize as part of the outer layout.
  Owns a center split manager.
  The split manager owns a split tree.
  Each split leaf is a workspace pane.
  Each split leaf pane has tabs.
  Each split leaf pane can split.
```

## Mental Model

```txt
WorkspaceWindow
└── WorkspaceBody
    └── PaneManager
        ├── LayoutPane: left
        │   └── WorkspacePane
        │       └── Tabs
        │
        ├── LayoutPane: center
        │   └── CenterSplitManager
        │       ├── WorkspacePane
        │       │   └── Tabs
        │       └── WorkspacePane
        │           └── Tabs
        │
        └── LayoutPane: right
            └── WorkspacePane
                └── Tabs
```

The tab component stays simple. It should not know about workspace layout or splitting.

## Capability Defaults

Outer fixed panes should use this behavior:

```ts
{
  canClose: false,
  canSplit: false,
  canResize: true,
  canCollapse: true,
}
```

Center split leaf panes should use this behavior:

```ts
{
  canClose: true,
  canSplit: true,
  canResize: true,
  canCollapse: false,
}
```

## Model Boundaries

- `WorkspaceWindow` owns the full user screen.
- `WorkspaceHeader` owns global workspace controls and context.
- `WorkspaceBody` is managed by `PaneManager`.
- `PaneManager` owns exactly three outer layout panes: `left`, `center`, and `right`.
- `LeftPane` and `RightPane` are fixed layout panes with tabs.
- `CenterPane` is a layout region, not a normal splittable pane.
- `CenterSplitManager` owns the split tree inside the center region.
- Every center split leaf is a `WorkspacePane`.
- Every `WorkspacePane` owns tab state.
- Tabs only display tab items and panels.

## Future Implementation Path

1. Add pure model factories for default workspace creation.
2. Add pure model actions for opening and closing tabs in a pane.
3. Add pure model actions for splitting center leaves horizontally or vertically.
4. Render `WorkspaceWindow`, `WorkspaceBody`, and fixed layout panes.
5. Render `CenterSplitManager` recursively.
6. Add resize handles to the outer panes.
7. Add resize handles between center split leaves.
8. Connect domain features like scene, devices, logs, and inspector views.

## Key Rule

```txt
Workspace panes organize layout.
Center split leaves organize work.
Tabs organize content.
Tab panels render views.
```

