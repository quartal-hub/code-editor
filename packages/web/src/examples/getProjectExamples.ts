import type { QEditorExample } from "./QEditorExample";
import type { FilesData } from "@/model/FilesData";
import { magicMultiplierProject } from "./projects/magicMultiplierProject";
import { demoSkillsProject } from "./projects/demoSkillsProject";
import { denoTest1Project } from "./projects/denoTest1Project";
import { filesAsData } from "./projects/projectHelpers";

const plainTsProject: FilesData = filesAsData(
  {
    "/index.ts": `import { greet } from "./greet";\n\nconsole.log(greet("world"));\n`,
    "/greet.ts": `/** Says hello. */\nexport function greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n`,
    "/tsconfig.json": `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "Bundler",\n    "strict": true\n  }\n}\n`,
  },
  { active: "/index.ts" },
);

/** Examples of the multi-file editor: the data is the set of files, shown with the page's own file list. */
export function getFilesExamples(): QEditorExample[] {
  const example = (title: string, descr: string, data: FilesData): QEditorExample => ({
    title,
    descr,
    props: { type: "files", data: data as unknown as Record<string, unknown> },
  });
  return [
    example("Plain TypeScript", "Two TypeScript files and a tsconfig: completion and go to definition work across the files.", plainTsProject),
    example("Magic multiplier skill", "Single-folder Cursor skill with SKILL.md and a TypeScript constant under scripts/.", magicMultiplierProject),
    example("Demo skills (collection)", "Folder of demo skills covering signature, transformation, formatting and sub-folder layouts.", demoSkillsProject),
    example("Deno: @qrtl-packages/test1", "Snapshot of a Deno hub package (deno.jsonc, .ts imports).", denoTest1Project),
  ];
}
