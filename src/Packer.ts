import { Tokenizer, Token } from './Tokenizer'
import { TokenScanner } from './TokenScanner'

const STRING_TYPES = ['a', 'A', 'h', 'H', 'Z']

export class Packer {
    private tokens: Token[]

    constructor(public format: string) {
        this.tokens = new Tokenizer(format).tokenize()
    }

    pack(data: Array<string | number>): Buffer {
        const scanner = new TokenScanner(this.tokens)
        const buffers: Buffer[] = []
        let i = -1
        while (++i < data.length) {
            // console.log({
            //     format: this.format,
            //     tokens: this.tokens.slice(this.index + 1),
            //     data,
            //     curData: data[i],
            //     i,
            //     buffers,
            // })
            if (scanner.allTokensConsumed()) {
                break
            }
            const { value: type } = scanner.consumeToken('type')
            let length = 1
            let sData = String(data[i] ?? '')

            if (scanner.peekToken('modifier_length')) {
                length = Number(scanner.consumeToken('modifier_length').value)
            }

            if (scanner.peekToken('modifier_splat')) {
                scanner.consumeToken('modifier_splat')

                if (STRING_TYPES.includes(type)) {
                    length = sData.length
                } else {
                    length = data.length - i
                }

                if (type === 'Z') {
                    length++
                }
            }

            switch (type) {
                case 'a':
                case 'Z':
                case 'A': {
                    let buff = Buffer.alloc(length)
                    sData = sData.padEnd(
                        length,
                        type === 'a' || type === 'Z' ? '\0' : ' '
                    )
                    buff.write(sData, 'utf8')

                    buffers.push(buff)
                    break
                }

                case 'H': {
                    if (!/^[0-9a-fA-F]+$/.test(sData)) {
                        throw Error(`Unsupported HEX string "${sData}"`)
                    }
                    const len = Math.ceil(length / 2)
                    const buff = Buffer.alloc(len)
                    if (length === 1) {
                        sData = sData.substring(0, 1).padEnd(2, '0')
                    } else {
                        sData = sData.padEnd(len * 2, '0')
                    }

                    buff.write(sData, 'hex')

                    buffers.push(buff)
                    break
                }

                // TODO not implemented
                //
                // case 'h': {
                //     if (!/^[0-9a-fA-F]+$/.test(sData)) {
                //         throw Error(`Unsupported HEX string "${sData}"`)
                //     }
                //     const len = Math.ceil(length / 2)
                //     const buff = Buffer.alloc(len)
                //     if (length === 1) {
                //         sData = sData.substring(0, 1).padEnd(2, '0')
                //     } else {
                //         sData = sData.padEnd(len * 2, '0')
                //     }

                //     buff.write(sData, 'hex')
                //     for (let i = 0; i < len; i++) {
                //         let v = buff.readUInt8(i)
                //         v = (v >> 4) | ((v << 4) & 0xff)
                //         buff.writeUInt8(v, i)
                //     }

                //     buffers.push(buff)
                //     break
                // }

                case 'n': {
                    const res = packIntegers({
                        data: data as number[],
                        i,
                        length: length !== -1 ? length : length / 8,
                        size: 16,
                    })
                    i = res.i
                    buffers.push(res.buffer)
                    break
                }
                case 'N': {
                    const res = packIntegers({
                        data: data as number[],
                        i,
                        length: length !== -1 ? length : length / 4,
                        size: 32,
                    })
                    i = res.i

                    buffers.push(res.buffer)
                    break
                }

                default: {
                    throw new Error(`Cannot pack type "${type}"`)
                }
            }
        }

        scanner.ensureAllTokensConsumed()
        // console.log('result', Buffer.concat(buffers))
        return Buffer.concat(buffers)
    }

    /**
     * @param input A Buffer to unpack
     */
    unpack<T extends Array<string | number>>(input: Buffer): T
    /**
     * @param input The string to unpack
     * @param encoding The encoding of the string, defaults to "binary"
     */
    unpack<T extends Array<string | number>>(
        input: string,
        encoding?: BufferEncoding
    ): T
    unpack<T extends Array<string | number>>(
        input: Buffer | string,
        encoding: BufferEncoding = 'binary'
    ): T {
        input = Buffer.isBuffer(input) ? input : Buffer.from(input, encoding)
        const scanner = new TokenScanner(this.tokens)

        let res: Array<string | number> = []
        while (scanner.peekToken('type')) {
            const { value: type } = scanner.consumeToken('type')

            let length = 1

            if (scanner.peekToken('modifier_length')) {
                length = Number(scanner.consumeToken('modifier_length').value)
            }

            if (scanner.peekToken('modifier_splat')) {
                scanner.consumeToken('modifier_splat')
                length = -1
            }

            switch (type) {
                case 'Z':
                case 'A':
                case 'a': {
                    let zPos = type === 'Z' ? input.indexOf('\x00') : -1
                    let len =
                        length === -1
                            ? zPos !== -1
                                ? zPos
                                : input.length
                            : length

                    // console.log({
                    //     input,
                    //     len,
                    //     zPos,
                    // })
                    // extract string (up to null byte for Z*)
                    const buf = input.subarray(
                        0,
                        zPos !== -1 && zPos < len ? zPos : len
                    )
                    // consume from input (up to null byte or length)
                    input = input.subarray(Math.max(zPos + 1, len))

                    const str = buf.toString('binary')
                    if (type === 'A') {
                        // trim null bytes and whitespace from the end
                        res.push(str.replace(/(\x00|\x20)+$/, ''))
                    } else {
                        res.push(str)
                    }
                    break
                }
                case 'N': {
                    const unpacked = unpackIntegers({
                        input,
                        length: length !== -1 ? length : input.length / 4,
                        size: 32,
                    })

                    // console.log(unpacked)
                    res = res.concat(unpacked.integers)
                    input = unpacked.truncatedInput

                    break
                }

                case 'n': {
                    const unpacked = unpackIntegers({
                        input,
                        length: length !== -1 ? length : input.length / 2,
                        size: 16,
                    })

                    // console.log(unpacked)
                    res = res.concat(unpacked.integers)
                    input = unpacked.truncatedInput

                    break
                }

                case 'H': {
                    const len =
                        length === -1 ? input.length : Math.ceil(length / 2)
                    const buf = input.subarray(0, len)
                    input = input.subarray(len)
                    // console.log({ buf, len, input: Buffer.concat([buf, input]), rest: input })
                    res.push(
                        buf
                            .toString('hex')
                            .substring(0, length === -1 ? undefined : length)
                    )
                    break
                }

                default: {
                    throw new Error(`Cannot unpack type "${type}"`)
                }
            }
        }

        scanner.ensureAllTokensConsumed()
        return res as T
    }
}

function packIntegers({
    data,
    i,
    length,
    size,
}: {
    data: number[]
    i: number
    length: number
    size: 16 | 32
}): { buffer: Buffer; i: number } {
    const word = size / 8
    const MAX_NUM = 2 ** size - 1

    let index = i - 1
    let len = i + length
    const buffer = Buffer.allocUnsafe(length * word)
    // console.log({data, i, index, length, len})
    while (++index < len) {
        const num = data[index]

        if (!Number.isInteger(num)) {
            throw new Error(
                `ArgumentError: Cannot pack value "${num}" as integer.`
            )
        }

        if (num > MAX_NUM || num < 0) {
            throw new Error(
                `RangeError: Cannot pack value "${num}" into ${size} bits. Must be between 0 and ${MAX_NUM}.`
            )
        }

        // console.log({ buffer, num: num >>> 0, offset: (index - i) * word, size: word })
        buffer.writeUIntBE(num >>> 0, (index - i) * word, word)
    }
    return { buffer, i: i + length - 1 }
}

function unpackIntegers({
    input,
    length,
    size,
}: {
    input: Buffer
    length: number
    size: 32 | 16
}): {
    truncatedInput: Buffer
    integers: number[]
} {
    const word = size / 8
    if ((length | 0) !== length || input.length < length * word) {
        throw new Error(
            `Cannot parse integer of size ${size} from data "${input.toString(
                'binary'
            )}".`
        )
    }
    const integers: number[] = []
    let i = -1
    while (++i < length) {
        // console.log({
        //     input,
        //     i,
        //     num: input.readUIntBE(i, word),
        //     raw: input.subarray(i * word, i * word + word),
        // })
        integers.push(input.readUIntBE(i * word, word))
    }

    return {
        integers,
        truncatedInput: input.subarray(length * word),
    }
}
