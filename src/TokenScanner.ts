import { Token, TokenType } from './Tokenizer'

export class TokenScanner {
    private index = -1
    constructor(public tokens: Token[]) {}

    consumeToken(type: TokenType): Token {
        const token = this.tokens[++this.index]
        if (!token || (type && token.type !== type)) {
            throw new Error(
                `Could not consume token of type "${type}", token was: ${token}`
            )
        }
        return token
    }

    peekToken(type: TokenType): boolean {
        const token = this.tokens[this.index + 1]
        if (!token) {
            return false
        }
        return token.type === type
    }

    allTokensConsumed(): boolean {
        return this.index === this.tokens.length - 1
    }

    ensureAllTokensConsumed() {
        const index = this.index
        this.index = -1
        if (index !== this.tokens.length - 1) {
            throw new Error(
                `ArgumentError There are fewer elements in the given data than the format requires`
            )
        }
    }
}
