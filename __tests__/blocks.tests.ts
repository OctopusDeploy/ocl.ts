import { Lexer } from "../src/lexer";
import { Parser } from "../src/parser";
import { TokenType } from "../src/token";

test("block_with_children_and_labels", () => {
    const lexer = new Lexer(`block_with_children_and_labels "Label 1" "Label 2" {
        child_block {}
        child_attribute = 1
    }`);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`block_with_children_and_labels`);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.STRING);
    expect(token.value).toEqual(`"Label 1"`);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.STRING);
    expect(token.value).toEqual(`"Label 2"`);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);
    expect(token.value).toEqual(`{`);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.ASSIGNMENT_OP);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.INTEGER);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.EOF);
});

test("empty block", () => {
    const lexer = new Lexer(`empty_block {
    }`);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.EOF);
});

test("inline empty block", () => {
    const lexer = new Lexer(`inline_empty_block { }`);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);

    token = lexer.nextToken();
    expect(token.tokenType).toEqual(TokenType.EOF);
});

test("block with delimited attribute value", () => {
    const lexer = new Lexer(`connectivity_policy {
    }
    
    versioning_strategy {
        template = "#{Octopus.Version.LastMajor}.#{Octopus.Version.LastMinor}.#{Octopus.Version.NextPatch}"
    }`);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`connectivity_policy`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);
    expect(token.value).toEqual(`{`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);
    expect(token.value).toEqual(`}`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`versioning_strategy`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);
    expect(token.value).toEqual(`{`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`template`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.ASSIGNMENT_OP);
    expect(token.value).toEqual(`=`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.STRING);
    expect(token.value).toEqual(`"#{Octopus.Version.LastMajor}.#{Octopus.Version.LastMinor}.#{Octopus.Version.NextPatch}"`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);
    expect(token.value).toEqual(`}`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.EOF);
    expect(token.value).toEqual(`EOF`);

    const parser = new Parser(lexer);
    expect(parser).toBeDefined();

    const ast = parser.getAST();
    expect(ast).toBeDefined();
});

test("invalid empty block with newline before open bracket", () => {
    const lexer = new Lexer(`my_block
    {
    }`);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`my_block`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeDefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);
    expect(token.value).toEqual(`{`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);
    expect(token.value).toEqual(`}`);

    token = lexer.nextToken();
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.EOF);
    expect(token.value).toEqual(`EOF`);
});

test("invalid empty block with unquoted label", () => {
    const lexer = new Lexer(`my block {
}`);
    expect(lexer).toBeDefined();

    let token = lexer.nextToken();
    expect(token.col).toEqual(1);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`my`);

    token = lexer.nextToken();
    expect(token.col).toEqual(4);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeDefined();
    expect(token.tokenType).toEqual(TokenType.SYMBOL);
    expect(token.value).toEqual(`block`);

    token = lexer.nextToken();
    expect(token.col).toEqual(10);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.OPEN_BRACKET);
    expect(token.value).toEqual(`{`);

    token = lexer.nextToken();
    expect(token.col).toEqual(11);
    expect(token.ln).toEqual(1);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.NEW_LINE);
    expect(token.value).toEqual(`\n`);

    token = lexer.nextToken();
    expect(token.col).toEqual(1);
    expect(token.ln).toEqual(2);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.CLOSE_BRACKET);
    expect(token.value).toEqual(`}`);

    token = lexer.nextToken();
    expect(token.col).toEqual(2);
    expect(token.ln).toEqual(2);
    expect(token.tokenError).toBeUndefined();
    expect(token.tokenType).toEqual(TokenType.EOF);
    expect(token.value).toEqual(`EOF`);
});

