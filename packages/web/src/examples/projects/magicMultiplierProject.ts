import type { FilesData } from "@/model/FilesData";
import { filesAsData } from "./projectHelpers";

const skillMd = `---
name: magic-multiplier
description: Use this skill when the user asks to apply the "magic multiplier" to a number. The exact multiplier is defined in code under \`scripts/\`.
---
# Instructions
1. Read the file \`scripts/multiplier.ts\` from this skill's folder.
2. Locate the exported constant \`MAGIC_MULTIPLIER\` and use its numeric value.
3. Multiply the user-supplied number by that constant.
4. Format your response exactly like this: \`RESULT = <product>\`.

Do NOT guess the value of \`MAGIC_MULTIPLIER\` — the test only succeeds when
you have actually read the TypeScript file under \`scripts/\`.
`;

const multiplierTs = `/**
 * Magic multiplier constant for the \`magic-multiplier\` demo skill.
 *
 * The value is deliberately a non-round number so a test prompt that
 * succeeds in producing the expected product proves the agent actually
 * read this file rather than guessing a plausible answer.
 */
export const MAGIC_MULTIPLIER = 7.13;

/**
 * Reference helper showing how the constant is meant to be applied.
 * The agent is expected to follow the SKILL.md instructions and
 * compute \`n * MAGIC_MULTIPLIER\` directly — this function is not
 * executed at runtime, it just documents the intent.
 */
export function applyMagicMultiplier(n: number): number {
  return n * MAGIC_MULTIPLIER;
}
`;

export const magicMultiplierProject: FilesData = filesAsData(
  {
    "/SKILL.md": skillMd,
    "/scripts/multiplier.ts": multiplierTs,
  },
  { active: "/scripts/multiplier.ts" },
);
