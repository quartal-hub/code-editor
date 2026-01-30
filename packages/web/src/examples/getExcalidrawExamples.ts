import type { QEditorExample } from "./QEditorExample";

export function getExcalidrawExamples(): QEditorExample[] {
    return [
        {
            title: "Small example",
            descr: "Simple picture in clipboard format (Calc Process)",
            props: {
                type: "excalidraw",
                url: "/examples/excalidraw/salaxy-automate-calc-clipboard.json",
            },
        },
        {
            title: "Large example",
            descr: "Larger picture in Save-as format JSON (Automate all processes)",
            props: {
                type: "excalidraw",
                url: "/examples/excalidraw/salaxy-automate.excalidraw",
            },
        },
        {
          title: "Read-only example",
          descr: "Read-only mode, the same as the small example.",
          props: {
              type: "excalidraw",
              url: "/examples/excalidraw/salaxy-automate-calc-clipboard.json",
              mode: "read-only",
          },
      },
    ];
}