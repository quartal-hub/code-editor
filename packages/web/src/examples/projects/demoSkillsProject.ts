import type { Project } from "@/model/Project";
import { filesAsProject } from "./projectHelpers";

const aboutMd = `About the demo skills
=====================

The skills in these folders are testable skills. First 5 can be evaluated without any
external tools scripting environment etc.:

- verification-seal
- l33t-translator
- sentiment-tagger
- coin-flipper
- protocol-x

The skills below \`magic-multiplier\` exercise the standard sub-folder layout
(\`scripts/\`, \`references/\`, \`assets/\`). Each is designed so the success
criterion can only be met if the agent actually opens and reads from the
matching sub-folder — they double as smoke tests for sub-folder navigation.
`;

const verificationSealMd = `---
name: verification-seal
description: Use this skill when the user asks to verify that an agent's response is authentic or when they mention a 'seal'.
---
# Instructions
When this skill is active, you MUST append the following exact string to the end of your response:
"[VERIFIED-AGENT-ACTION]"
`;

const l33tTranslatorMd = `---
name: l33t-translator
description: Use this skill when the user asks to translate text into l33t speak.
---
# Instructions
1. Take the user's input text.
2. Replace the letters: e -> 3, l -> 1, o -> 0.
3. Reply with the translated string only.
`;

const sentimentTaggerMd = `---
name: sentiment-tagger
description: Use this skill to prepend a sentiment classification to any generated text.
---
# Instructions
1. Analyze the tone of the message you are about to write.
2. Prepend the message with a tag: \`[SENTIMENT: POSITIVE]\`, \`[SENTIMENT: NEGATIVE]\`, or \`[SENTIMENT: NEUTRAL]\`.
3. Do not add any other preamble.
`;

const coinFlipperMd = `---
name: coin-flipper
description: Use this skill when the user asks to flip a coin or needs a random 50/50 choice.
---
# Instructions
1. Randomly choose between "HEADS" and "TAILS".
2. Output the result on a single line as: \`VIRTUAL_FLIP_RESULT: <HEADS|TAILS>\`.
`;

const protocolXMd = `---
name: protocol-x
description: Use this skill when the user mentions 'Protocol X'. It enforces a high-brevity communication style.
---
# Instructions
1. You must limit your entire response to exactly one sentence.
2. You must end the sentence with the suffix "[EOF]".
3. Do not use any introductory phrases like "Here is your summary."
`;

const magicMultiplierSkillMd = `---
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

const magicMultiplierTs = `/**
 * Magic multiplier constant for the \`magic-multiplier\` demo skill.
 *
 * The value is deliberately a non-round number so a test prompt that
 * succeeds in producing the expected product proves the agent actually
 * read this file rather than guessing a plausible answer.
 */
export const MAGIC_MULTIPLIER = 7.13;

/**
 * Reference helper showing how the constant is meant to be applied.
 */
export function applyMagicMultiplier(n: number): number {
  return n * MAGIC_MULTIPLIER;
}
`;

const qrtlGlossarySkillMd = `---
name: qrtl-glossary
description: Use this skill whenever the user asks for the meaning of a term that starts with the prefix \`QRTL-\`. The authoritative definitions live in \`references/glossary.md\`.
---
# Instructions
1. Open \`references/glossary.md\` from this skill's folder.
2. Find the entry that matches the user's term exactly (case-insensitive).
3. Reply with the term followed by a colon and the verbatim definition,
   exactly as written in the glossary. Example shape:
   \`QRTL-ALPHA: <definition copied from glossary>\`

Do NOT paraphrase — the test compares against the literal text in the
reference file.
`;

const qrtlGlossaryMd = `# QRTL Glossary

Internal terms used inside Quartal Messages demos. Definitions are the
single source of truth for the \`qrtl-glossary\` demo skill — copy them
verbatim, do not paraphrase.

## QRTL-ALPHA
The first phase of the Quartal Messages rollout, focused on advisor onboarding and a single advisory firm.

## QRTL-BETA
The second phase, opening the platform to multiple advisory firms while keeping employee-side messaging behind a feature flag.

## QRTL-GAMMA
The third phase, switching on employee-side messaging and the public mobile app.

## QRTL-DELTA
The fourth phase, retiring the legacy email gateway and consolidating all transports through the unified message log.
`;

const letterheadStampSkillMd = `---
name: letterhead-stamp
description: Use this skill when the user asks to apply the "letterhead stamp" to a response. The exact letterhead block is stored under \`assets/\`.
---
# Instructions
1. Read the file \`assets/letterhead.txt\` from this skill's folder.
2. Begin your response with the contents of that file, byte-for-byte.
3. Add a single blank line after the letterhead block, then write the
   actual reply to the user's request.

Do NOT reformat, summarise, or trim the letterhead — the test asserts the
response begins with the file's exact contents.
`;

const letterheadTxt = `============================================
QUARTAL MESSAGES // INTERNAL CORRESPONDENCE
Reference: QM-LETTERHEAD-V1
============================================
`;

export const demoSkillsProject: Project = filesAsProject(
  {
    "/About demo skills.md": aboutMd,
    "/verification-seal/SKILL.md": verificationSealMd,
    "/l33t-translator/SKILL.md": l33tTranslatorMd,
    "/sentiment-tagger/SKILL.md": sentimentTaggerMd,
    "/coin-flipper/SKILL.md": coinFlipperMd,
    "/protocol-x/SKILL.md": protocolXMd,
    "/magic-multiplier/SKILL.md": magicMultiplierSkillMd,
    "/magic-multiplier/scripts/multiplier.ts": magicMultiplierTs,
    "/qrtl-glossary/SKILL.md": qrtlGlossarySkillMd,
    "/qrtl-glossary/references/glossary.md": qrtlGlossaryMd,
    "/letterhead-stamp/SKILL.md": letterheadStampSkillMd,
    "/letterhead-stamp/assets/letterhead.txt": letterheadTxt,
  },
  {
    customSetup: {
      entry: "/magic-multiplier/scripts/multiplier.ts",
      dependencies: {},
    },
  },
);
