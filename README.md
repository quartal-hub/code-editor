Quartal Hub Code UI (https://code.qrtl.com)
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
