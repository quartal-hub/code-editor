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
- `/function`: Editor for a single function within a class
- `/class`: Visual editor for a class
  - Properties editor for data structure
  - Expression and functions: add/remove/edit
  - Undersands interfaces: Add remove and validation.
- `/project`: A project editor: Quartal Hub business logic tools and Quartal Hub UXs
  - Quartal Hub business logic
  - Salaxy business logic
  - Quartal Hub UX editor

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
  - Move SandpackMonacoPackages and SandpackMonacoSync to code-editors-core as much as possible and remove TODOs/HACKs
  - Refactor ClassEditor.vue to use the same logic
