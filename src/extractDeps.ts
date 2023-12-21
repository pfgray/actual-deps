import ts, { Node, SyntaxKind } from "typescript";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/lib/function";

export function extractDeps(
  sourceFile: ts.SourceFile
): TE.TaskEither<never, string[]> {
  let deps: Array<string> = [];
  extractDepsFromNode(sourceFile, deps);
  return TE.right(
    pipe(deps, A.filterMap(extractModuleNameFromModuleSpecifier))
  );
}

const extractDepsFromNode = (node: Node, deps: Array<string>): void => {
  // todo: should we handle `export from 'foo'`?

  // normal top-level imports
  if (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    deps.push(node.moduleSpecifier.text);
  }
  // dynamic imports
  else if (
    ts.isCallExpression(node) &&
    node.expression.kind === SyntaxKind.ImportKeyword
  ) {
    const firstArg = node.arguments[0];
    if (ts.isStringLiteral(firstArg)) {
      deps.push(firstArg.text);
    }
  } else {
    node.forEachChild((n) => {
      extractDepsFromNode(n, deps);
    });
  }
};

/**
 * Extracts the module name from an import specifier,
 * accounting for relative imports, deep imports, and
 * scoped packages. Returns None in the case of relative
 * imports
 *
 * Examples:
 *
 * '@canvas/foo/bar.js' -> Some('@canvas/foo')
 * './foo/bar'          -> None
 * '../foo/bar'         -> None
 * 'jquery/foo'         -> Some('jquery')
 * 'foo'                -> Some('foo')
 *
 * @param moduleSpecifier the import path to extract a module from
 * @returns
 */
const extractModuleNameFromModuleSpecifier = (
  moduleSpecifier: string
): O.Option<string> => {
  // ignore relative imports
  if (moduleSpecifier.startsWith(".")) {
    return O.none;
  } else if (moduleSpecifier.startsWith("@")) {
    if (moduleSpecifier.indexOf("/", moduleSpecifier.indexOf("/") + 1) > 0) {
      return O.some(
        moduleSpecifier.substring(
          0,
          moduleSpecifier.indexOf("/", moduleSpecifier.indexOf("/") + 1)
        )
      );
    } else {
      return O.some(moduleSpecifier);
    }
  } else if (moduleSpecifier.indexOf("/") > 0) {
    return O.some(moduleSpecifier.substring(0, moduleSpecifier.indexOf("/")));
  } else {
    return O.some(moduleSpecifier);
  }
};
