import { parse } from "@babel/parser";

export type DocParam = {
  name: string;
  description: string;
};

export type DocInfo = {
  description?: string;
  params: DocParam[];
  returns?: string;
};

export type OwnerInfo = {
  kind: "class" | "interface";
  name: string;
  implements?: string[];
  extends?: string[];
  description?: string;
};

export type ClassInfo = {
  name: string;
  implements?: string[];
  extends?: string[];
  description?: string;
  start: number;
  end: number;
  bodyStart: number;
  bodyEnd: number;
};

export type ParsedMethod = {
  name: string;
  owner: OwnerInfo;
  doc: DocInfo;
  editable: boolean;
  /** Start index of the BlockStatement `{ ... }` */
  start?: number;
  /** End index of the BlockStatement `{ ... }` */
  end?: number;
  /** The raw source between `{` and `}` */
  content?: string;
};

export class ClassParser {
  static parseClasses(source: string): ClassInfo[] {
    const ast = parse(source, {
      sourceType: "module",
      plugins: ["typescript", "classProperties", "decorators-legacy"],
      errorRecovery: false,
      ranges: false,
    });

    const found: ClassInfo[] = [];

    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;

      const n = node as any;

      if (n.type === "ClassDeclaration") {
        if (n.start != null && n.end != null && n.body?.start != null && n.body?.end != null) {
          found.push({
            name: n.id?.name ?? "AnonymousClass",
            implements: extractImplements(n.implements),
            extends: extractExtends(n.superClass),
            description: parseDocInfo(n).description,
            start: n.start,
            end: n.end,
            bodyStart: n.body.start,
            bodyEnd: n.body.end,
          });
        }
      }

      Object.values(n).forEach((child) => {
        if (Array.isArray(child)) child.forEach(walk);
        else walk(child);
      });
    };

    walk(ast.program);
    return found;
  }

  static parseMethods(source: string): ParsedMethod[] {
    const ast = parse(source, {
      sourceType: "module",
      plugins: ["typescript", "classProperties", "decorators-legacy"],
      errorRecovery: false,
      ranges: false,
    });

    const found: ParsedMethod[] = [];

    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;

      const n = node as any;

      if (n.type === "ClassDeclaration") {
        const owner: OwnerInfo = {
          kind: "class",
          name: n.id?.name ?? "AnonymousClass",
          implements: extractImplements(n.implements),
          extends: extractExtends(n.superClass),
          description: parseDocInfo(n).description,
        };

        const body = n.body?.body ?? [];
        body.forEach((member: any) => {
          if (member.type === "ClassMethod" && member.body) {
            const methodName = getMemberName(member.key);
            const doc = parseDocInfo(member);
            const start: number | undefined = member.body?.start;
            const end: number | undefined = member.body?.end;
            found.push({
              name: methodName,
              owner,
              doc,
              editable: start != null && end != null,
              start: start ?? undefined,
              end: end ?? undefined,
              content: start != null && end != null ? source.slice(start + 1, end - 1) : undefined,
            });
          }
        });
      }

      if (n.type === "TSInterfaceDeclaration") {
        const owner: OwnerInfo = {
          kind: "interface",
          name: n.id?.name ?? "AnonymousInterface",
          extends: extractExtendsList(n.extends),
          description: parseDocInfo(n).description,
        };

        const body = n.body?.body ?? [];
        body.forEach((member: any) => {
          if (member.type === "TSMethodSignature") {
            const methodName = getMemberName(member.key);
            const doc = parseDocInfo(member);
            found.push({
              name: methodName,
              owner,
              doc,
              editable: false,
            });
          }
        });
      }

      Object.values(n).forEach((child) => {
        if (Array.isArray(child)) child.forEach(walk);
        else walk(child);
      });
    };

    walk(ast.program);
    return found;
  }
}

function extractImplements(nodes: any[] | null | undefined): string[] | undefined {
  if (!nodes || nodes.length === 0) return undefined;
  const names = nodes
    .map((node) => getExpressionName(node.expression))
    .filter((value): value is string => Boolean(value));
  return names.length ? names : undefined;
}

function extractExtends(node: any | null | undefined): string[] | undefined {
  const name = getExpressionName(node);
  return name ? [name] : undefined;
}

function extractExtendsList(nodes: any[] | null | undefined): string[] | undefined {
  if (!nodes || nodes.length === 0) return undefined;
  const names = nodes
    .map((node) => getExpressionName(node.expression))
    .filter((value): value is string => Boolean(value));
  return names.length ? names : undefined;
}

function getExpressionName(node: any | null | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === "Identifier") return node.name;
  if (node.type === "TSQualifiedName") {
    const left = getExpressionName(node.left);
    const right = getExpressionName(node.right);
    return left && right ? `${left}.${right}` : right ?? left;
  }
  return undefined;
}

function getMemberName(node: any): string {
  return (
    node?.name ??
    (typeof node?.value === "string" ? node.value : undefined) ??
    "method"
  );
}

function parseDocInfo(node: any): DocInfo {
  const raw = getJsDocComment(node);
  if (!raw) {
    return { params: [] };
  }

  const lines = raw
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter((line) => line.length > 0);

  const params: DocParam[] = [];
  const descriptionParts: string[] = [];
  let returns: string | undefined;

  for (const line of lines) {
    if (line.startsWith("@param")) {
      const match = line.match(/^@param\s+(?:\{[^\}]+\}\s+)?(\S+)\s*(.*)$/);
      if (match) {
        params.push({ name: match[1], description: match[2]?.trim() ?? "" });
      }
      continue;
    }
    if (line.startsWith("@returns") || line.startsWith("@return")) {
      const match = line.match(/^@returns?\s+(?:\{[^\}]+\}\s+)?(.*)$/);
      returns = match?.[1]?.trim() ?? "";
      continue;
    }
    if (line.startsWith("@")) {
      continue;
    }
    descriptionParts.push(line);
  }

  return {
    description: descriptionParts.length ? descriptionParts.join(" ") : undefined,
    params,
    returns,
  };
}

function getJsDocComment(node: any): string | undefined {
  const comments = node?.leadingComments;
  if (!Array.isArray(comments) || comments.length === 0) return undefined;
  const jsDoc = [...comments].reverse().find(
    (comment) => comment.type === "CommentBlock" && comment.value?.includes("*")
  );
  return jsDoc?.value;
}
