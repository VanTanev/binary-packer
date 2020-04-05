import { Tokenizer, Token } from '../src/Tokenizer'

describe(Tokenizer, () => {
    function subject(format: string) {
        return new Tokenizer(format).tokenize()
    }

    test('simple format', () => {
        const tokens = [new Token('type', 'A')]
        expect(subject('A')).toEqual(tokens)
    })

    test('modifier splat', () => {
        const tokens = [
            new Token('type', 'A'),
            new Token('modifier_splat', '*'),
        ]
        expect(subject('A*')).toEqual(tokens)
    })

    test('modifier length', () => {
        const tokens = [
            new Token('type', 'A'),
            new Token('modifier_length', '55'),
        ]
        expect(subject('A55')).toEqual(tokens)
    })

    test('whitespace is ignored', () => {
        const ws = ' \t\n\v\f\r'
        const tokens = [new Token('type', 'A'), new Token('type', 'Z')]
        expect(subject(`${ws}A${ws}Z${ws}`)).toEqual(tokens)
    })
})
