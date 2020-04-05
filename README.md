# binary-packer

This is a packer/unpacker that provides an (incomplete) interface mimicking Ruby's `Array#pack` / `String#unpack`.

### Disclaimer

This project SHOULD NOT BE USED IN PRODUCTION SYSTEMS.
The API is not complete and it may change at any moment.

### Packing data

```typescript
import { Packer } from 'binay-packer'

new Packer('A3A3A3').pack(['a', 'b', 'c'])
// => "a  b  c  "

new Packer('a3a3a3').pack(['a', 'b', 'c'])
// => "a\000\000b\000\000c\000\000"
```

Directives `A,` `a,` and `Z` may be followed by a count, which gives the width of the resulting field.
The remaining directives also may take a count, indicating the number of array elements to convert.
If the count is an asterisk (`*`), all remaining array elements will be converted.

| Directive | Data Type | Meaning                                                |
| --------- | --------- | ------------------------------------------------------ |
| n         | Integer   | 16-bit unsigned, network (big-endian) byte order       |
| N         | Integer   | 32-bit unsigned, network (big-endian) byte order       |
|           |           |                                                        |
| A         | String    | arbitrary binary string (space padded, count is width) |
| a         | String    | arbitrary binary string (null padded, count is width)  |
| Z         | String    | same as `a`, except that null is added with `*`        |
| H         | String    | hex string (high nibble first)                         |

### Unpacking data

```typescript
import { Packer } from 'binay-packer'

new Packer('A6Z6').unpack('abc \0\0abc \0\0')
// => ["abc", "abc "]

new Packer('a3a3').unpack('abc \0\0')
// => ["abc", " \000\000"]

new Packer('Z*Z*').unpack('abc \0abc \0')
// => ["abc ", "abc "]
```

The format string consists of a sequence of single-character directives, summarized in the table at the end of this entry.
Each directive may be followed by a number, indicating the number of times to repeat with this directive.
An asterisk (`*`) will use up all remaining elements.

| Directive | Data Type | Meaning                                                          |
| --------- | --------- | ---------------------------------------------------------------- |
| n         | Integer   | 16-bit unsigned, network (big-endian) byte order                 |
| N         | Integer   | 32-bit unsigned, network (big-endian) byte orderm                |
|           |           |                                                                  |
| A         | String    | arbitrary binary string (remove trailing nulls and ASCII spaces) |
| a         | String    | arbitrary binary string                                          |
| Z         | String    | null-terminated string                                           |
| H         | String    | hex string (high nibble first)                                   |
