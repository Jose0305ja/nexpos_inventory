const ts = require('typescript');

const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2019,
  sourceMap: true,
  esModuleInterop: true,
  importHelpers: true,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
};

module.exports = {
  process(sourceText, sourcePath) {
    if (/\.tsx?$/.test(sourcePath)) {
      const { outputText, sourceMapText } = ts.transpileModule(sourceText, {
        compilerOptions,
        fileName: sourcePath,
        transformers: undefined,
        reportDiagnostics: false,
      });

      return {
        code: outputText,
        map: sourceMapText ?? undefined,
      };
    }

    return sourceText;
  },
};
