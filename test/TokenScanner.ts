import { TokenScanner } from '../src/TokenScanner'
import { Tokenizer, Token } from '../src/Tokenizer'

describe(TokenScanner, () => {
    let subject: TokenScanner
    beforeEach(() => {
        subject = new TokenScanner(new Tokenizer('A10Z*').tokenize())
    })

    describe('consumeToken()', () => {
        it('can consume', () => {
            let value: string
            value = subject.consumeToken('type').value
            expect(value).toEqual('A')

            value = subject.consumeToken('modifier_length').value
            expect(value).toEqual('10')

            value = subject.consumeToken('type').value
            expect(value).toEqual('Z')

            value = subject.consumeToken('modifier_splat').value
            expect(value).toEqual('*')
        })

        it('throws when the expected token type cannot be consumed', () => {
            expect(() => {
                subject.consumeToken('modifier_length')
            }).toThrowError(
                'Could not consume token of type "modifier_length", token was: {"type":"type","value":"A"}'
            )
        })
    })

    describe('peekToken()', () => {
        it('peeks sucessfully', () => {
            expect(subject.peekToken('type')).toEqual(true)
        })

        it('can fail to peek', () => {
            expect(subject.peekToken('modifier_length')).toEqual(false)
        })
    })

    describe('allTokensConsumed()', () => {
        beforeEach(() => {
            subject = new TokenScanner([new Token('type', 'A')])
        })

        it('can succeed', () => {
            subject.consumeToken('type')
            expect(subject.allTokensConsumed()).toEqual(true)
        })

        it('can fail', () => {
            expect(subject.allTokensConsumed()).toEqual(false)
        })
    })

    describe('ensureAllTokensConsumed()', () => {
        beforeEach(() => {
            subject = new TokenScanner([new Token('type', 'A')])
        })

        it('can succeed', () => {
            subject.consumeToken('type')
            expect(() => subject.ensureAllTokensConsumed()).not.toThrowError()
        })

        it('can fail', () => {
            expect(() => subject.ensureAllTokensConsumed()).toThrowError()
        })
    })
})
