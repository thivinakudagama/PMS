const { Project, SyntaxKind } = require("ts-morph");
const fs = require("fs");

async function main() {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath("src/app/(dashboard)/actions.ts");

  // 1. Update imports
  const nextHeadersImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === "next/headers");
  if (nextHeadersImport) {
    const hasHeaders = nextHeadersImport.getNamedImports().some(ni => ni.getName() === "headers");
    if (!hasHeaders) {
      nextHeadersImport.addNamedImport("headers");
    }
  }

  // 2. Add redirectWithError function if missing
  const functionExists = sourceFile.getFunction("redirectWithError");
  if (!functionExists) {
    sourceFile.addFunction({
      isAsync: true,
      name: "redirectWithError",
      returnType: "Promise<never>",
      parameters: [
        { name: "message", type: "string" },
        { name: "fallbackPath", type: "string", initializer: '"/dashboard"' }
      ],
      statements: `
  const headersList = await headers();
  const referer = headersList.get("referer");
  let redirectPath = fallbackPath;
  if (referer) {
    try {
      const url = new URL(referer);
      url.searchParams.set("error", message);
      redirectPath = url.pathname + url.search;
    } catch (e) {
      // Ignore
    }
  } else {
    redirectPath = \`\${fallbackPath}?error=\${encodeURIComponent(message)}\`;
  }
  redirect(redirectPath);
      `
    });
  }

  // 3. Replace throw new Error(...) with await redirectWithError(...)
  const throwStatements = sourceFile.getDescendantsOfKind(SyntaxKind.ThrowStatement);
  for (const throwStmt of throwStatements) {
    const expr = throwStmt.getExpression();
    if (expr && expr.getKind() === SyntaxKind.NewExpression) {
      const newExpr = expr;
      if (newExpr.getExpression().getText() === "Error") {
        const args = newExpr.getArguments();
        if (args.length > 0) {
          const errMsg = args[0].getText();
          throwStmt.replaceWithText(`await redirectWithError(${errMsg});`);
        }
      }
    }
  }

  // 4. Wrap unhandled supabase.from calls
  // Find all AwaitExpressions
  const awaitExprs = sourceFile.getDescendantsOfKind(SyntaxKind.AwaitExpression);
  for (const awaitExpr of awaitExprs) {
    const text = awaitExpr.getText();
    if (text.includes("supabase.from(")) {
      // Check if it's an ExpressionStatement (meaning it's not assigned to anything)
      const parent = awaitExpr.getParent();
      if (parent.getKind() === SyntaxKind.ExpressionStatement) {
        // It's unhandled!
        const exprText = parent.getText();
        parent.replaceWithText(`{\n  const { error } = ${exprText.replace(/;?$/, '')};\n  if (error) await redirectWithError(error.message);\n}`);
      }
    }
  }

  await sourceFile.save();
  console.log("Refactoring complete.");
}

main().catch(console.error);
