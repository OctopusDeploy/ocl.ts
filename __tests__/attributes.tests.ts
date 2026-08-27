import { Lexer } from "../src/lexer";
import { Parser } from "../src/parser";
import { TokenType } from "../src/token";
import { collectProblems } from "./support/problems";

test("invalid integer attribute with newline before assignment operator", () => {
    const source = `int_attribute
    = 1`;
    const lexer = new Lexer(source);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.col).toEqual(1);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`int_attribute`);

    token = lexer.nextToken();
    expect(token.col).toEqual(14);
    expect(token.ln).toEqual(1);
    // The lexer is context-free -- it cannot see the preceding token, so a
    // newline in an invalid position is not a token-level error. The parser is
    // what rejects this input; asserted at the end of the test.
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.col).toEqual(5);
    expect(token.ln).toEqual(2);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.ASSIGNMENT_OP);
    expect(token.value).toEqual(`=`);

    token = lexer.nextToken();
    expect(token.col).toEqual(7);
    expect(token.ln).toEqual(2);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.INTEGER);
    expect(token.value).toEqual(`1`);

    token = lexer.nextToken();
    expect(token.col).toEqual(8);
    expect(token.ln).toEqual(2);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.EOF);
    expect(token.value).toEqual(`EOF`);
    // Invalid input is rejected during parsing. Note the fresh Lexer: the one
    // above has been drained by the assertions, and a drained lexer yields an
    // empty AST.
    const problems = collectProblems(new Parser(new Lexer(source)).getAST());
    expect(problems).toContain(
        'Unexpected token. Expected attribute or block definition.'
    );
});

test("invalid integer attribute with newline before value", () => {
    const source = `int_attribute =
 1`;
    const lexer = new Lexer(source);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.col).toEqual(1);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`int_attribute`);

    token = lexer.nextToken();
    expect(token.col).toEqual(15);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.ASSIGNMENT_OP);
    expect(token.value).toEqual(`=`);

    token = lexer.nextToken();
    expect(token.col).toEqual(16);
    expect(token.ln).toEqual(1);
    // The lexer is context-free -- it cannot see the preceding token, so a
    // newline in an invalid position is not a token-level error. The parser is
    // what rejects this input; asserted at the end of the test.
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.col).toEqual(2);
    expect(token.ln).toEqual(2);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.INTEGER);
    expect(token.value).toEqual(`1`);

    token = lexer.nextToken();
    expect(token.col).toEqual(3);
    expect(token.ln).toEqual(2);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.EOF);
    expect(token.value).toEqual(`EOF`);
    // Invalid input is rejected during parsing. Note the fresh Lexer: the one
    // above has been drained by the assertions, and a drained lexer yields an
    // empty AST.
    const problems = collectProblems(new Parser(new Lexer(source)).getAST());
    expect(problems).toContain(
        'Unexpected token. Expected literal, dictionary or array after assignment operator.'
    );
});

test("integer attribute", () => {
    const lexer = new Lexer(`int_attribute = 1`);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.col).toEqual(1);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`int_attribute`);

    token = lexer.nextToken();
    expect(token.col).toEqual(15);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.ASSIGNMENT_OP);
    expect(token.value).toEqual(`=`);

    token = lexer.nextToken();
    expect(token.col).toEqual(17);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.INTEGER);
    expect(token.value).toEqual(`1`);

    token = lexer.nextToken();
    expect(token.col).toEqual(18);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.EOF);
    expect(token.value).toEqual(`EOF`);
});