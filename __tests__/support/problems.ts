import { AST, ASTNode, NodeType } from "../../src/ast";

/**
 * Walks an AST and collects every problem reported against it, including the
 * problems attached to RecoveryNodes. Used by tests that assert invalid OCL is
 * rejected -- the lexer is context-free, so this rejection happens in the
 * parser rather than at the token level.
 */
export function collectProblems(ast: AST | ASTNode | ASTNode[]): string[] {
  const problems: string[] = [];

  const visit = (node: ASTNode | ASTNode[] | undefined): void => {
    if (node === undefined) {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node.problems !== undefined) {
      problems.push(...node.problems);
    }
    if (node.type === NodeType.DICTIONARY_NODE) {
      visit(node.entries);
    }
    if (node.type === NodeType.ARRAY_NODE) {
      visit(node.values);
    }
    visit(node.children);
  };

  visit(ast as ASTNode[]);
  return problems;
}
