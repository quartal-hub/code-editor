import { describe, expect, it } from "vitest";
import { MonacoPackages } from "./MonacoPackages";

function fakeMonaco() {
  const libs: { uri: string; disposed: boolean }[] = [];
  const add = (_text: string, uri: string) => {
    const lib = { uri, disposed: false };
    libs.push(lib);
    return { dispose: () => { lib.disposed = true; } };
  };
  return { libs, monaco: { languages: { typescript: { typescriptDefaults: { addExtraLib: add }, javascriptDefaults: { addExtraLib: add } } } } };
}

const cache = (types: Record<string, string | null>) =>
  ({ getTypes: async (name: string) => types[name] ?? null, getMonacoFileUri: (name: string) => `file:///node_modules/${name}/index.d.ts` }) as never;

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

describe("MonacoPackages", () => {
  it("reads only the dependencies, and survives a missing or broken package.json", () => {
    expect(MonacoPackages.parseDependencies('{"dependencies":{"a":"1"},"devDependencies":{"b":"1"}}')).toEqual(["a"]);
    expect(MonacoPackages.parseDependencies(undefined)).toEqual([]);
    expect(MonacoPackages.parseDependencies("{ not json")).toEqual([]);
    expect(MonacoPackages.parseDependencies("{}")).toEqual([]);
  });

  it("registers the types of each dependency for TypeScript and JavaScript, once", async () => {
    const { libs, monaco } = fakeMonaco();
    const packages = new MonacoPackages(monaco, cache({ a: "declare const a: 1;", b: null }));
    const json = '{"dependencies":{"a":"1","b":"1"}}';
    packages.sync(json);
    packages.sync(json);
    await settle();
    expect(libs.map((l) => l.uri)).toEqual(["file:///node_modules/a/index.d.ts", "file:///node_modules/a/index.d.ts"]);
  });

  it("forgets removed dependencies, also while they are still loading", async () => {
    const { libs, monaco } = fakeMonaco();
    const packages = new MonacoPackages(monaco, cache({ a: "x", b: "y" }));
    packages.sync('{"dependencies":{"a":"1"}}');
    await settle();
    packages.sync('{"dependencies":{"b":"1"}}');
    expect(libs.every((l) => l.uri.includes("/a/") && l.disposed)).toBe(true);
    packages.sync("{}");
    await settle();
    expect(libs.filter((l) => l.uri.includes("/b/")).length).toBe(0);
    packages.dispose();
  });
});
