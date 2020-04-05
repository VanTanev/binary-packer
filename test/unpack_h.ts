import { expectUnpack } from './unpack_util'

describe("Pack#unpack with format 'H'", () => {
    it('decodes one nibble from each byte for each format character starting with the most significant bit', () => {
        const data: [string, string, string[]][] = [
            ['\x8f', 'H', ['8']],
            ['\xf8\x0f', 'HH', ['f', '0']],
        ]
        data.forEach(([data, format, expected]) => {
            expectUnpack(format, data, expected)
        })
    })

    it('decodes only the number of nibbles in the string when passed a count', () => {
        expectUnpack('H5', '\xca\xfe', ['cafe'])
    })

    it('decodes multiple differing nibble counts from a single string', () => {
        expectUnpack('HH2H3H4H5', '\xaa\x55\xaa\xd4\xc3\x6b\xd7\xaa\xd7', [
            'a',
            '55',
            'aad',
            'c36b',
            'd7aad',
        ])
    })

    it("decodes a directive with a '*' modifier after a directive with a count modifier", () => {
        expectUnpack('H3H*', '\xaa\x55\xaa\xd4\xc3\x6b', ['aa5', 'aad4c36b'])
    })

    it("decodes a directive with a count modifier after a directive with a '*' modifier", () => {
        expectUnpack('H*H3', '\xaa\x55\xaa\xd4\xc3\x6b', ['aa55aad4c36b', ''])
    })

    it('decodes the number of nibbles specified by the count modifier', () => {
        const data: [string, string, string[]][] = [
            ['\xab', 'H0', ['']],
            ['\x00', 'H1', ['0']],
            ['\x01', 'H2', ['01']],
            ['\x01\x23', 'H3', ['012']],
            ['\x01\x23', 'H4', ['0123']],
            ['\x01\x23\x45', 'H5', ['01234']],
        ]
        data.forEach(([data, format, expected]) => {
            expectUnpack(format, data, expected)
        })
    })

    it("decodes all the nibbles when passed the '*' modifier", () => {
        const data: [string, string[]][] = [
            ['', ['']],
            ['\xab', ['ab']],
            ['\xca\xfe', ['cafe']],
        ]
        data.forEach(([data, expected]) => {
            expectUnpack('H*', data, expected)
        })
    })

    it('adds an empty string for each element requested beyond the end of the String', () => {
        const data: [string, string[]][] = [
            ['', ['', '', '']],
            ['\x01', ['0', '', '']],
            ['\x01\x80', ['0', '8', '']],
        ]
        data.forEach(([data, expected]) => {
            expectUnpack('HHH', data, expected)
        })
    })

    it('ignores NULL bytes between directives', () => {
        expectUnpack('H\x00H', '\x01\x10', ['0', '1'])
    })

    it('ignores spaces between directives', () => {
        expectUnpack('H H', '\x01\x10', ['0', '1'])
    })
})

// not implemented
//
// describe("Pack#unpack with format 'h'", () => {
//     it('decodes one nibble from each byte for each format character starting with the least significant bit', () => {
//         const data: [string, string, string[]][] = [
//             ['\x8f', 'h', ['f']],
//             ['\xf8\x0f', 'hh', ['8', 'f']],
//         ]
//         data.forEach(([data, format, expected]) => {
//             expectUnpack(format, data, expected)
//         })
//     })

//     // it("decodes only the number of nibbles in the string when passed a count", () => {
//     //   "\xac\xef".unpack("h5").should == ["cafe"]
//     // })

//     // it("decodes multiple differing nibble counts from a single string", () => {
//     //   array = "\xaa\x55\xaa\xd4\xc3\x6b\xd7\xaa\xd7".unpack("hh2h3h4h5")
//     //   array.should == ["a", "55", "aa4", "3cb6", "7daa7"]
//     // })

//     // it("decodes a directive with a '*' modifier after a directive with a count modifier", () => {
//     //   "\xba\x55\xaa\xd4\xc3\x6b".unpack("h3h*").should == ["ab5", "aa4d3cb6"]
//     // })

//     // it("decodes a directive with a count modifier after a directive with a '*' modifier", () => {
//     //   "\xba\x55\xaa\xd4\xc3\x6b".unpack("h*h3").should == ["ab55aa4d3cb6", ""]
//     // })

//     // it("decodes the number of nibbles specified by the count modifier", () => {
//     //   [ ["\xab",         "h0", [""]],
//     //     ["\x00",         "h1", ["0"]],
//     //     ["\x01",         "h2", ["10"]],
//     //     ["\x01\x23",     "h3", ["103"]],
//     //     ["\x01\x23",     "h4", ["1032"]],
//     //     ["\x01\x23\x45", "h5", ["10325"]]
//     //   ].should be_computed_by(:unpack)
//     // })

//     // it("decodes all the nibbles when passed the '*' modifier", () => {
//     //   [ ["",          [""]],
//     //     ["\xab",      ["ba"]],
//     //     ["\xac\xef",  ["cafe"]],
//     //   ].should be_computed_by(:unpack, "h*")
//     // })

//     // it("adds an empty string for each element requested beyond the end of the String", () => {
//     //   [ ["",          ["", "", ""]],
//     //     ["\x01",      ["1", "", ""]],
//     //     ["\x01\x80",  ["1", "0", ""]]
//     //   ].should be_computed_by(:unpack, "hhh")
//     // })

//     // it("ignores NULL bytes between directives", () => {
//     //   "\x01\x10".unpack("h\x00h").should == ["1", "0"]
//     // })

//     // it("ignores spaces between directives", () => {
//     //   "\x01\x10".unpack("h h").should == ["1", "0"]
//     // })

//     // it("should make strings with US_ASCII encoding", () => {
//     //   "\x01".unpack("h")[0].encoding.should == Encoding::US_ASCII
//     // })
// })
