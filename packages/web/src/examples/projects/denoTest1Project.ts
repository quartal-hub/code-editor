import type { FilesData } from "@/model/FilesData";
import { filesAsData } from "./projectHelpers";

// Snapshot of @qrtl-packages/test1 — a Deno package. The editor only edits the files: Deno
// style specifiers (JSR, `.ts` extensions, the deno.jsonc imports map) are not resolved by Monaco.
// Heavy generated artefacts (qrtl-hub/tools.json, types/salaxy.d.ts) and the
// Deno-only formulas/tests trees are intentionally omitted from this snapshot.

const denoJsonc = `{
  "name": "@qrtl-packages/test1",
  "version": "0.1.2",
  "description": "First test package for Quartal Hub packages.",
  "style": {
    "logo": "https://cdn.quartal.com/img/logo/quartal-logo-vertical.png",
    "icon": "https://cdn.quartal.com/img/logo/quartal-logo-q.png"
  },
  "license": "MIT",
  "exports": {
    ".": "./tools/mod.ts"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/quartal-accounting/hub-packages.git"
  },
  "tasks": {
    "start": "deno run -R=. -N ./main.ts",
    "dev": "deno run -RWE -N --watch=./tools/ ./dev.ts",
    "docs": "deno run -RWE @quartal/hub-pkg-core/docs-gen",
    "test": "deno test -R -N"
  },
  "lint": {
    "exclude": ["./formulas/**/*.js", "./types/**/*.d.ts"]
  },
  "deploy": {
    "org": "quartal",
    "app": "test1"
  }
}
`;

const readmeMd = `# Quartal packages Test1 (@qrtl-packages/test1)

This is the first test package for testing anonymous APIs

## TODO-list

This is work in progress, want to add the following featues:

- Ability to specify GET/POST/DELETE/PATCH for methods.
- Classes, functions, types and schemas visualizer for debugging
- Add more tests for different cases
  - Consider trying to get the coverage.
`;

const mainTs = `import { getAnonApp } from "@quartal/hub-pkg-core";

const app = await getAnonApp({ packageRootFolder: import.meta.dirname });
Deno.serve(app.fetch);
`;

const devTs = `import { generateTools, getAnonApp } from "@quartal/hub-pkg-core";

await generateTools();

const app = await getAnonApp({ packageRootFolder: import.meta.dirname });
Deno.serve(app.fetch);
`;

const demoSkillMd = `---
name: demo-skill
description: Provides a minimal demo skill structure. Use when creating or testing a simple Cursor skill file in this package.
---

# Demo Skill

## Instructions

- Keep responses short and actionable.
- Prefer one concrete next step when asked what to do.

## Example

If asked for a starter task, suggest: "Create \`src/mod.ts\` and export a single function."
`;

const toolsModTs = `export * from "./model/index.ts";
export * from "./HelloWorld.ts";
export * from "./Calculator.ts";
export * from "./TypesTester.ts";
`;

const calculatorTs = `import type { MultiplyThese } from "./model/index.ts";

/**
 * A class that calculates things.
 */
export class Calculator {
  /**
   * Add two numbers. This example uses inline / anonymous types.
   * @param input - The parameters.
   * @returns The sum of the two numbers.
   */
  static add(input: {
    /** The first number to add */
    first: number;
    /** The second number to add */
    second: number;
  }): number {
    return input.first + input.second;
  }

  /**
   * Multiply two numbers with a custom type. This example uses a named interface for the input.
   *
   * This description is longer with some paragraphs etc.
   *
   * @param input - The parameters.
   * @example
   * \`\`\`ts
   * const result = calculator.multiply({ first: 5, second: 3 });
   * console.log(result); // 15
   * \`\`\`
   * @returns The product of the two numbers.
   */
  multiply(input: MultiplyThese): number {
    return input.first * input.second;
  }
}
`;

const helloWorldTs = `import type { GreetingType } from "./model/GreetingType.ts";

/**
 * A class that says hello to the world.
 */
export class HelloWorld {
  /**
   * Say hello to the world.
   * @param input - The parameters.
   * @returns The greeting.
   */
  static sayHello(input: {
    /** The name to say hello to. */
    name?: string;
  }): string {
    return \`Hello, \${input.name ?? "World"}!\`;
  }

  /** Function with advanced parameters. */
  sayHelloAdvanced(input: GreetingType): string {
    return \`Hello, \${input.name}! You are \${input.age} years old and your gender is \${input.gender}. Your keywords are \${
      input.keywords.join(", ")
    }.\`;
  }

  /**
   * Function using this to access private method.
   * @param input - The parameters.
   * @returns The greeting.
   */
  sayHelloWithThis(input: {
    /** The name to say hello to. */
    name: string;
  }): string {
    return this.privateSayHello(input.name);
  }

  private privateSayHello(name: string): string {
    return \`Hello with this, \${name}!\`;
  }
}
`;

const typesTesterTs = `import type {
  TypeTesterArraysInput,
  TypeTesterArraysResult,
  TypeTesterJsonSchemaFormats,
  TypeTesterMixed,
  TypeTesterNestedObjectInput,
  TypeTesterNestedObjectResult,
  TypeTesterOptionalAndNull,
  TypeTesterPrimitives,
  TypeTesterTree,
  TypeTesterUnionParam,
} from "./model/index.ts";

/**
 * Tester class for validating different parameter types via the Hub API.
 * Each method takes a single object parameter for easy Open API / MCP / RPC schema generation and validation.
 */
export class TypesTester {
  /**
   * Recursive tree type (named interface). Used to verify JSON serialization of codeFiles does not fail with cycles.
   * @param input - Root tree node.
   * @returns Sum of all node values.
   */
  static treeSum(input: TypeTesterTree): number {
    return input.value + (input.children ?? []).reduce((acc, c) => acc + TypesTester.treeSum(c), 0);
  }
  /**
   * Primitives: string, number, boolean.
   * @param input - Object with primitive fields.
   * @returns Echo of the input for verification.
   */
  static primitives(input: TypeTesterPrimitives): TypeTesterPrimitives {
    return { text: input.text, count: input.count, flag: input.flag };
  }

  /**
   * The formats defined in the JSON schema specification.
   * @param input - Object with JSON schema formats.
   * @returns Object with the same values.
   */
  static jsonSchemaFormats(input: TypeTesterJsonSchemaFormats): TypeTesterJsonSchemaFormats {
    return { ...input };
  }

  /**
   * Optional and nullable fields.
   */
  static optionalAndNull(input: TypeTesterOptionalAndNull): string {
    const opt = input.optional ?? "(missing)";
    const n = input.nullable ?? 0;
    const nish = input.nullish ?? false;
    return \`required=\${input.required} optional=\${opt} nullable=\${n} nullish=\${nish}\`;
  }

  /** Array types: array of strings and array of numbers. */
  static arrays(input: TypeTesterArraysInput): TypeTesterArraysResult {
    const labels = input.labels?.join(", ") ?? "";
    const sum = (input.values ?? []).reduce((a: number, b: number) => a + b, 0);
    return { labels, sum };
  }

  /** Nested object in params. */
  static nestedObject(input: TypeTesterNestedObjectInput): TypeTesterNestedObjectResult {
    return {
      id: input.id,
      name: input.payload.name,
      score: input.payload.score,
    };
  }

  /** Union type parameter (string literal union). */
  static unionParam(input: TypeTesterUnionParam): { kind: string } {
    return { kind: input.kind };
  }

  /** Mixed: primitives, array, and optional in one object. */
  static mixed(input: TypeTesterMixed): Record<string, unknown> {
    return {
      title: input.title,
      count: input.count,
      tags: input.tags ?? [],
      meta: input.meta ?? null,
    };
  }
}
`;

const modelIndexTs = `export * from "./GreetingType.ts";
export * from "./MultiplyThese.ts";
export * from "./TypeTesterArraysInput.ts";
export * from "./TypeTesterArraysResult.ts";
export * from "./TypeTesterJsonSchemaFormats.ts";
export * from "./TypeTesterMixed.ts";
export * from "./TypeTesterNestedObjectInput.ts";
export * from "./TypeTesterNestedObjectResult.ts";
export * from "./TypeTesterOptionalAndNull.ts";
export * from "./TypeTesterPrimitives.ts";
export * from "./TypeTesterTree.ts";
export * from "./TypeTesterUnionParam.ts";
`;

const greetingTypeTs = `/**
 * A type that represents a very complex greeting.
 */
export interface GreetingType {
  /** The name of the person to greet. */
  name: string;
  /** The age of the person to greet (number). */
  age: number;
  /** Example of a enum: The gender of the person to greet. */
  gender: "male" | "female";

  /** Example of an array of keywords. */
  keywords: string[];
}
`;

const multiplyTheseTs = `/** Custom type for multiplying two numbers. */
export interface MultiplyThese {
  /**
   * The first number.
   * @example 5
   */
  first: number;
  /**
   * The second number.
   * @example 3
   */
  second: number;
}
`;

const arraysInputTs = `/** Array types: array of strings and array of numbers. */
export interface TypeTesterArraysInput {
  /** List of labels. */
  labels: string[];
  /** List of numbers to sum. */
  values: number[];
}
`;

const arraysResultTs = `/** Result of arrays aggregation. */
export interface TypeTesterArraysResult {
  /** Concatenated labels. */
  labels: string;
  /** Sum of the numbers. */
  sum: number;
}
`;

const mixedTs = `/** Mixed: primitives, array, and optional in one object. */
export interface TypeTesterMixed {
  /** The title of the mixed object. */
  title: string;
  /** The count of the mixed object. */
  count: number;
  /** The tags of the mixed object. */
  tags: string[];
  /** The meta of the mixed object. */
  meta?: { source: string };
}
`;

const primitivesTs = `/** Primitives: string, number, boolean. */
export interface TypeTesterPrimitives {
  /** A string value. */
  text: string;
  /** A number value. */
  count: number;
  /** A boolean value. */
  flag: boolean;
}
`;

const unionParamTs = `/** Union type parameter (string literal union). */
export interface TypeTesterUnionParam {
  /** One of the allowed values. */
  kind: "alpha" | "beta" | "gamma";
}
`;

const treeTs = `/**
 * Recursive tree node for testing ref-only serialization (no circular references in JSON).
 */
export interface TypeTesterTree {
  /** Node value. */
  value: number;
  /** Child nodes (recursive reference). */
  children: TypeTesterTree[];
}
`;

const optionalAndNullTs = `/** Optional and nullable fields. */
export interface TypeTesterOptionalAndNull {
  /** Required string. */
  required: string;

  /** Optional string. */
  optional?: string;

  /** Explicitly nullable number. */
  nullable: number | null;

  /** May be optional or null. */
  nullish?: boolean | null;
}
`;

const nestedObjectInputTs = `/** Nested object in params. */
export interface TypeTesterNestedObjectInput {
  /** Outer id. */
  id: string;
  /** Nested payload. */
  payload: {
    /** Inner name. */
    name: string;
    /** Inner score. */
    score: number;
  };
}
`;

const nestedObjectResultTs = `/** Flattened result of nested object. */
export interface TypeTesterNestedObjectResult {
  /** The id of the nested object result. */
  id: string;
  /** The name of the nested object result. */
  name: string;
  /** The score of the nested object result. */
  score: number;
}
`;

const jsonSchemaFormatsTs = `/**
 * The formats defined in the JSON schema specification (e.g. @format tags in docs).
 */
export interface TypeTesterJsonSchemaFormats {
  /**
   * A date string (ISO 8601, e.g. 2026-03-10).
   * @format date
   */
  date?: string;

  /**
   * A date-time string (ISO 8601, e.g. 2026-03-10T12:00:00.000Z).
   * @format date-time
   */
  dateTime?: string;

  /**
   * A time string (ISO 8601, e.g. 12:00:00.000).
   * @format time
   */
  time?: string;

  /**
   * A duration string (ISO 8601, e.g. P1Y2M3DT4H5M6S).
   * @format duration
   */
  duration?: string;

  /**
   * An email address, e.g. "user@example.com".
   * @format email
   */
  email?: string;

  /**
   * A complete URI (RFC 3986), e.g. "https://example.com/api/v1/users".
   * @format uri
   */
  uri?: string;

  /**
   * A URI or a relative reference, e.g. "/api/v1/users".
   * @format uri-reference
   */
  uriReference?: string;

  /**
   * A Universally Unique Identifier (e.g., 550e8400-e29b-41d4-a716-446655440000).
   * @format uuid
   */
  uuid?: string;
}
`;

export const denoTest1Project: FilesData = filesAsData(
  {
    "/deno.jsonc": denoJsonc,
    "/README.md": readmeMd,
    "/main.ts": mainTs,
    "/dev.ts": devTs,
    "/skills/demo-skill/SKILL.md": demoSkillMd,
    "/tools/mod.ts": toolsModTs,
    "/tools/Calculator.ts": calculatorTs,
    "/tools/HelloWorld.ts": helloWorldTs,
    "/tools/TypesTester.ts": typesTesterTs,
    "/tools/model/index.ts": modelIndexTs,
    "/tools/model/GreetingType.ts": greetingTypeTs,
    "/tools/model/MultiplyThese.ts": multiplyTheseTs,
    "/tools/model/TypeTesterArraysInput.ts": arraysInputTs,
    "/tools/model/TypeTesterArraysResult.ts": arraysResultTs,
    "/tools/model/TypeTesterMixed.ts": mixedTs,
    "/tools/model/TypeTesterPrimitives.ts": primitivesTs,
    "/tools/model/TypeTesterUnionParam.ts": unionParamTs,
    "/tools/model/TypeTesterTree.ts": treeTs,
    "/tools/model/TypeTesterOptionalAndNull.ts": optionalAndNullTs,
    "/tools/model/TypeTesterNestedObjectInput.ts": nestedObjectInputTs,
    "/tools/model/TypeTesterNestedObjectResult.ts": nestedObjectResultTs,
    "/tools/model/TypeTesterJsonSchemaFormats.ts": jsonSchemaFormatsTs,
  },
  { active: "/main.ts" },
);
