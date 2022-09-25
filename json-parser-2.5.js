const hexMap = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
};

class JsonParser {
    
    constructor() {
        this.cursor = 0;
    }
    
    parse(buffer) {
        this.cursor = 0;
        return this.parseJson(buffer);
    }

    parseJson(buffer) {
        return this.parseValue(buffer);
    }

    parseValue(buffer) {
        const array = this.parseArray(buffer);
        if (array) {
            return array;
        }
        const string = this.parseString(buffer);
        if (string) {
            return string;
        }
        return this.parseNumber(buffer);
    }

    parseArray(buffer) {
        const cursorStart = this.cursor;
        if (buffer[this.cursor] === "[") {
            this.cursor++;
            const elements = this.parseElements(buffer);
            if (elements) {
                if (buffer[this.cursor] === "]") {
                    this.cursor++;
                    return elements;
                } else {
                    this.cursor = cursorStart;
                    return null;
                }
            } else {
                this.parseWs(buffer);
                if (buffer[ws.cursor] === "]") {
                    this.cursor++;
                    return []
                }
            }
        }
        this.cursor = cursorStart;
        return null;
    }

    parseElements(buffer) {
        const cursorStart = this.cursor;
        const element = this.parseElement(buffer);
        if (element) {
            if (buffer[this.cursor] === ",") {
                this.cursor++;
                const elements = this.parseElements(buffer);
                if (elements) {
                    return [element, ...elements];
                } else {
                    this.cursor = cursorStart;
                    return null;
                }
            } else {
                return [element];
            }
        }
        this.cursor = cursorStart;
        return null;
    }

    parseElement(buffer) {
        const cursorStart = this.cursor;
        this.parseWs(buffer);
        const value = this.parseValue(buffer);
        if (value) {
            this.parseWs(buffer);
            return value;
        } else {
            this.cursor = cursorStart;
            return null;
        }
    }

    parseString(buffer, cursor) {
        const cursorStart = this.cursor;
        if (buffer[this.cursor] === '"') {
            this.cursor++;
            const characters = this.parseCharacters(buffer, cursor + 1);
            if (buffer[characters.cursor] === '"') {
                this.cursor++;
                return characters;
            }
        }
        this.cursor = cursorStart;
        return null;
    }

    parseCharacters(buffer) {
        const character = this.parseCharacter(buffer);
        if (character) {
            const characters = this.parseCharacters(buffer);
            return character + characters;
        } else {
            return "";
        }
    }

    parseCharacter(buffer) {
        const cursorStart = this.cursor;
        const char = buffer[this.cursor];
        if (char === "\\") {
            this.cursor++;
            const escape = this.parseEscape(buffer);
            if (escape) {
                return escape;
            }
        } else {
            if (char !== '"') {
                this.cursor++;
                return char;
            }
        }
        this.cursor = cursorStart;
        return null;
    }

    parseEscape(buffer) {
        const char = buffer[this.cursor];
        this.cursor++;
        switch (char) {
            case '"':
                return '"';
            case "\\":
                return "\\";
            case "\/":
                return "\/";
            case "b":
                return "\b";
            case "f":
                return "\f";
            case "n":
                return "\n";
            case "r":
                return "\r";
            case "t":
                return "\t";
            case "u":
                // todo: error handling
                const hex1 = this.parseHex(buffer);
                const hex2 = this.parseHex(buffer);
                const hex3 = this.parseHex(buffer);
                const hex4 = this.parseHex(buffer);
                const code = ((((hex1 * 16) + hex2) * 16) + hex3) * 16 + hex4;
                return String.fromCharCode(code);
            default:
                this.cursor--;
                return null;
        }
    }

    parseHex(buffer) {
        const char = buffer[this.cursor];
        if ("0123456789abcdefABCDEF".indexOf(char)) {
            this.cursor++;
            return hexMap[char];
        } else {
            return null;
        }
    }

    parseWs(buffer, cursor) {
        const char = buffer[this.cursor];
        if (char === "\u0020" ||
            char === "\u000A" ||
            char === "\u000D" ||
            char === "\u0009") {
            this.cursor++;
            // Could use while loop instead
            this.parseWs(buffer);
            // return value for WS doesn't matter
            return;
        }
        return;
    }

    parseNumber(buffer) {
        const cursorStart = this.cursor;
        const integer = this.parseInteger(buffer);
        if (integer !== null) {
            const fraction = this.parseFraction(buffer, integer.cursor);
            if (fraction !== null) {
                const exponent = this.parseExponent(buffer, fraction.cursor);
                if (exponent !== null) {
                    return Number(integer + fraction + exponent);
                }
            }
            return Number(integer + fraction);
        } else {
            this.cursor = cursorStart;
            return null;
        }
    }

    parseFraction(buffer) {
        if (buffer[this.cursor] === ".") {
            this.cursor++;
            const digits = this.parseDigits(buffer);
            if (digits !== null) {
                return "." + digits;
            }
        }
        return "";
    }

    parseExponent(buffer) {
        const cursorStart = this.cursor;
        if (buffer[this.cursor] === "e" || buffer[this.cursor] === "E") {
            this.cursor++;
            const sign = this.parseSign(buffer);
            if (sign) {
                const digits = this.parseDigits(buffer);
                if (digits) {
                    return "e" + sign + digits;
                } else {
                    this.cursor = cursorStart;
                    return "";
                }
            }
        }
        return "";
    }

    parseSign(buffer) {
        if (buffer[this.cursor] === "-") {
            this.cursor++;
            return "-";
        }
        return "";
    }

    parseInteger(buffer) {
        const cursorStart = this.cursor;
        if (buffer[this.cursor] === "-") {
            this.cursor++;
            
            // try integer -> "-" onenine digits first
            const oneNine = this.parseOneNine(buffer);
            if (oneNine) {
                const digits = this.parseDigits(buffer);
                if (digits) {
                    return "-" + oneNine + digits;
                }
            }
            this.cursor = cursorStart + 1;
            // try integer -> "-" digit
            const digit = this.parseDigit(buffer);
            if (digit) {
                return "-" + digit;
            } else {
                this.cursor = cursorStart;
                return null;
            }
        }
        
        this.cursor = cursorStart;
        // try integer -> onenine digits first
        const oneNine = this.parseOneNine(buffer);
        if (oneNine) {
            const digits = this.parseDigits(buffer);
            if (digits) {
                return oneNine + digits;
            }
        }
        this.cursor = cursorStart;
        // try integer -> digit
        return this.parseDigit(buffer);
    }

    parseDigit(buffer) {
        const char = buffer[this.cursor];
        if ("0123456789".indexOf(char) !== -1) {
            this.cursor++;
            return char;
        } else {
            return null;
        }
    }

    parseOneNine(buffer) {
        const char = buffer[this.cursor];
        if ("123456789".indexOf(char) !== -1) {
            this.cursor++;
            return char;
        } else {
            return null;
        }
    }

    parseDigits(buffer) {
        let digits = "";
        while (true) {
            const digit = this.parseDigit(buffer);
            if (digit != null) {
                digits += digit;
            } else {
                if (digits === "") {
                    return null;
                } else {
                    return digits;
                }
            }
        }
    }

}

test();

function test() {

    const testCases = [
        "5",
        "123",
        "-12",
        "-6",
        "12.50",
        "-5.6",
        "12.5e10",
        "4e5",
        "abc",
        "[1, 2.5, -0.5]",
        "[1,2.5,-0.5]",
        "[1,2.5-0.5]",
        `"abcde"`,
        `"abc\tde"`
    ];
    const parser = new JsonParser();

    for (let testCase of testCases) {
        const output = parser.parse(testCase);
        if (output !== null) {
            console.log(`"${testCase}" =`, output);
        } else {
            console.log(`"${testCase}" no parse found.`);
        }
    }
    
}