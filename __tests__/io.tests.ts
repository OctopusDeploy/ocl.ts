import fs from 'fs/promises';
import { Lexer } from '../src/lexer';
import { Parser } from '../src/parser';
import { TokenType } from '../src/token';

const astFixture = './__tests__/ast.json';

const serialiseAST = (ast: unknown): string =>
  JSON.stringify(ast, (key, value) => {
    if (key === 'parent' || key === 'children') {
      return;
    }
    if (key === 'tokenType') {
      return TokenType[value];
    }
    return value;
  }, 2);

test("parses test.ocl into the expected AST", async () => {
  const code = await fs.readFile('./__tests__/test.ocl', 'utf-8');
  const parser = new Parser(new Lexer(code));
  const actual = serialiseAST(parser.getAST());

  // Regenerate with UPDATE_AST_FIXTURE=1 npx jest io, and review the diff.
  if (process.env['UPDATE_AST_FIXTURE'] === '1') {
    await fs.writeFile(astFixture, actual);
    return;
  }

  const expected = await fs.readFile(astFixture, 'utf-8');
  expect(JSON.parse(actual)).toEqual(JSON.parse(expected));
});
