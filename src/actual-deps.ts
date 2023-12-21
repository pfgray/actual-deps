#!/usr/bin/env node
import * as ts from "typescript";
import * as TE from "fp-ts/TaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import * as Str from "fp-ts/String";
import * as E from "fp-ts/Either";
import glob from "glob";
import { flow, pipe } from "fp-ts/function";
import { extractDeps } from "./extractDeps";

const getFiles = TE.taskify<string, Error, string[]>(glob);

const fileOrFolderToProcess = process.argv.slice(2);

pipe(
  fileOrFolderToProcess,
  TE.traverseArray(getFiles),
  TE.map(RA.flatten),
  TE.chainW(getAllDeps), // like promise.then
  (a) => a
)().then(
  E.fold(
    (e) => console.error(e),
    (deps) => deps.forEach((d) => console.log(d))
  )
);

function getAllDeps(fileNames: string[]) {
  let program = ts.createProgram(fileNames, {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    experimentalDecorators: true,
    jsx: ts.JsxEmit.React,
  });

  return pipe(
    program.getSourceFiles(),
    TE.traverseArray(extractDeps),
    TE.map(flow(RA.flatten, RA.uniq(Str.Eq)))
  );
}
