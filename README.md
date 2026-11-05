Quartal Hub Code UI (https://code.quartal.com)
===========================================

Simple Read application (SPA) that implements various customized code editors for Quartal Hub.

This is a stand-alone site for editing code without any authentication or storage. Calling web UIs
pass the code to the various editors and observer changes in the code.

Paths:

- `/`: Intro page: Ability to test the below pages in iframes
  - This is the only page that has navigation (left-side) and it then has the below pages in Iframe
  - Uses QEditor component to show the pages in the iframe
  - The QEditor component can be copied as separate package (or perhaps even build/publish script)
    - The published package should be a Web component so it can be used in Vanilla JS, Vue etc.
- `/monaco`: Stand-alone Monaco editor that is used in editing single files
  - JSON: A JSON editor for editing and transfering data from one environment to another.
  - CSS: Style sheets and Skins as 
  - JS/TS: JavaScript/TypeScript editing without context for a single file
    - Pass the context with methods
  - HTML: Single HTML file
- `/markdown`: WYSIWYG Markdown editor (Milkdown Crepe)
- `/markdown-hybrid`: Obsidian-like hybrid Markdown editor (@vscode/markdown-editor): markers are shown in the block being edited.
  For test / evaluation purposes only: use `/markdown` instead
- `/skin`: Visual editor for Bootstrap based skins
- `/expression`: Simple excel-like expression editor.
- `/function`: Placeholder for an editor of a single function within a class. Not listed on the site.
- `/class`: Visual editor for a class
  - Properties editor for data structure
  - Expression and functions: add/remove/edit
  - Undersands interfaces: Add remove and validation.
- `/files`: A Monaco editor for many files (Quartal Hub business logic tools, skills, UXs). It has no file list,
  tabs or storage: the host (the `QFileExplorer` of `@quartal/ui-core`, or any page) owns them and tells the editor
  which files are open and which one is shown. See "Files editor protocol" below.

The `qrtl-editor` element
=========================

`packages/web/public/qrtl-editor.js` wraps the iframe and the messages of all the editors as attributes, methods and
events. The table on the About page lists them by editor. It is built from `packages/web/src/data/editorApi.ts`: when an
editor page or `qrtl-editor.js` changes, change that file too.

Files editor protocol
=====================

The `/files` page speaks protocol 2 with its parent window (`postMessage`). It never talks to a server and keeps no
state between loads: the parent reads and writes the files, and that is also why the page needs no authentication.
The messages are typed in `packages/code-editors-core/src/workspace/WorkspaceFile.ts`. A message is accepted only from
`window.parent`.

Files are identified by their **address**, e.g. `/data/reports/2026.ts`; it is also the path of the Monaco model, so
imports between files resolve.

Parent to editor:

| `type` | Fields | Does |
| --- | --- | --- |
| `open-file` | `file {address, text, lang?, readOnly?, version?}`, `show?` (default true), `selection?` | Opens a file (a model); shows it unless `show` is false |
| `show-file` | `address`, `selection?` | Shows an open file; its cursor, scroll and undo history are kept |
| `close-file` | `address` | Closes a file; pending edits are reported first |
| `rename-file` | `from`, `to` | Follows a rename or move of a file or folder |
| `update-file` | `address`, `text`, `version?` | Replaces the text with a change made elsewhere (as an undoable edit; not reported back) |
| `set-context` | `context {files?, tsconfig?, packageJson?}` | Background files for the language services, the TypeScript options, the dependencies whose types to load |
| `set-options` | `readOnly?`, `theme?` | Editor-wide options |
| `set-data` | `data {files, active?, context?}` | Convenience: context from all `files`, and the `active` (or first) file opened |

Editor to parent:

| `type` | Fields | When |
| --- | --- | --- |
| `editor-ready` | `protocol: 2` | The page is up (messages sent before Monaco has loaded wait and are applied in order) |
| `file-change` | `address`, `text`, `version?` | The user edited a file (debounced 250 ms; also when a file is closed or saved). The parent decides what is dirty by comparing with what it last saved |
| `file-command` | `command: "save"`, `address` | Ctrl/Cmd+S |
| `file-request` | `address`, `selection?` | The user went to a file that is not open (go to definition): the parent opens it with `open-file` |
| `file-focus` | `address` | The editor showed another file (the user followed a reference into an open file) |

The single-file `/monaco` page keeps its own messages (`editor-ready`, `set-data`, `on-change`).

GitHub Pages
============

`.github/workflows/pages.yml` builds `packages/web` and publishes it to GitHub Pages on every push to `main`
(Settings > Pages > Source must be "GitHub Actions"). The base path comes from `PAGES_BASE_PATH`
(set by the workflow; defaults to `/`, which is what production at https://code.quartal.com uses).

TODO-list
=========

These things still need to be addressed:

- Deployment: Upload script or another way to deployment.
- index.html: Optimize the used fonts before going to production:
  - Quartal fonts not needed in editors, only in the main page
  - Select the Material icons that are used to make package smaller.
- Support communication using events:
  1. Load the iframe without query parameters (wait for ready event)
  2. Pass the code etc. parameters using events.
  3. Pass changes back as events.
  4. When changes in the iframe parent, send changes as events, not as query params.
- Package handling
  - Refactor ClassEditor.vue to use `MonacoPackages` and `WorkspaceModels` (code-editors-core)
