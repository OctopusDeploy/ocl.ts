import { Token, TokenType } from "./token";

export class Lexer {
  private code: string;
  private pc: number;
  private col: number;
  private ln: number;
  private currentTokenCol: number;
  private currentTokenLn: number;
  private currentChar: string;

  constructor(code: string) {
    this.code = code;
    this.pc = -1;
    this.col = 0;
    this.ln = 1;
    this.currentTokenCol = 0;
    this.currentTokenLn = 0;
    this.currentChar = '';
    this.nextChar();
  }

  private nextChar(): void {
    this.pc += 1;
    if (this.currentChar === '\n') {
      this.col = 1;
      this.ln += 1;
    }
    else {
      this.col += 1;
    }
    if (this.pc < this.code.length) {
      this.currentChar = this.code[this.pc];
      return;
    }
    this.currentChar = 'EOF';
  }

  public nextToken(): Token {
    while (this.currentChar === ' ') {
      this.nextChar();
    }

    this.currentTokenLn = this.ln;
    this.currentTokenCol = this.col;

    if (!Number.isNaN(parseInt(this.currentChar))) {
      return this.tokenizeNumberLiteral();
    }

    switch (this.currentChar) {
      case '"': {
        return this.tokenizeStringLiteral();
      }
      case '\n': {
        return this.tokenizeCurrentChar(TokenType.NEW_LINE);
      }
      case '{': {
        return this.tokenizeCurrentChar(TokenType.OPEN_BRACKET);
      }
      case '}': {
        return this.tokenizeCurrentChar(TokenType.CLOSE_BRACKET);
      }
      case '[': {
        return this.tokenizeCurrentChar(TokenType.OPEN_ARRAY);
      }
      case ']': {
        return this.tokenizeCurrentChar(TokenType.CLOSE_ARRAY);
      }
      case '=': {
        return this.tokenizeCurrentChar(TokenType.ASSIGNMENT_OP);
      }
      case 'EOF': {
        return this.tokenizeCurrentChar(TokenType.EOF);
      }
      default: {
        let value = '';
        while (!['EOF', '\n', ' ', '"', '=', '{', '}', '[', ']', '\''].includes(this.currentChar)) {
          value += this.currentChar;
          this.nextChar();
        }
        return new Token(
          value,
          this.currentTokenLn,
          this.currentTokenCol,
          TokenType.SYMBOL
        );
      }
    }
  }

  private tokenizeStringLiteral(): Token {
    let value = this.currentChar;
    this.nextChar();
    while (this.currentChar !== '"') {
      value += this.currentChar;
      if (this.currentChar === '\\') {
        this.nextChar();
        value += this.currentChar;
      }
      if (['EOF', '\n'].includes(this.currentChar)) {
        return this.tokenizeValue(
          value,
          TokenType.STRING,
          'Expected "; Got \\\\n',
        );
      }
      this.nextChar();
    }
    value += this.currentChar;
    this.nextChar();
    return this.tokenizeValue(
      value,
      TokenType.STRING
    );
  }

  private tokenizeNumberLiteral(): Token {
    let value = this.currentChar;
    let decimalTally = 0;
    let tokenType = TokenType.INTEGER;
    this.nextChar();
    while (!Number.isNaN(parseInt(this.currentChar))) {
      value += this.currentChar;
      if (this.currentChar === '.') {
        decimalTally += 1;
        tokenType = TokenType.DECIMAL;
      }
      this.nextChar();
    }
    if (decimalTally > 1) {
      return this.tokenizeValue(
        value,
        tokenType,
        `Expected 1 decimal; Got ${decimalTally}`
      )
    }
    return this.tokenizeValue(
      value,
      tokenType
    )
  }

  private tokenizeCurrentChar(tokenType: TokenType, error?: string): Token {
    const value = this.currentChar;
    this.nextChar();
    return this.tokenizeValue(
      value,
      tokenType,
      error
    );
  }

  private tokenizeValue(value: string, tokenType: TokenType, error?: string): Token {
    return new Token(
      value,
      this.currentTokenLn,
      this.currentTokenCol,
      tokenType,
      error,
    );
  }
}
