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

    for (let testCase of testCases) {
        const output = parseJson(testCase, 0);
        if (output) {
            console.log(`"${testCase}" =`, output.value);
        } else {
            console.log(`"${testCase}" no parse found.`);
        }
    }
    
}

function parseJson(buffer, cursor) {
    return parseValue(buffer, cursor);
}

function parseValue(buffer, cursor) {
    /*parseObject(buffer, cursor);
    parseArray(buffer, cursor);
    ...*/
    const array = parseArray(buffer, cursor);
    if (array) {
        return array;
    }
    const string = parseString(buffer, cursor);
    if (string) {
        return string;
    }
    return parseNumber(buffer, cursor);
}

function parseArray(buffer, cursor) {
    if (buffer[cursor] === "[") {
        const elements = parseElements(buffer, cursor + 1);
        if (elements) {
            if (buffer[elements.cursor] === "]") {
                return {
                    value: elements.value,
                    cursor: elements.cursor + 1
                };
            } else {
                return null;
            }
        } else {
            const ws = parseWs(buffer, cursor + 1);
            if (ws) {
                if (buffer[ws.cursor] === "]") {
                    return {
                        value: [],
                        cursor: ws.cursor + 1
                    };
                }
            }
        }
    }
    return null;
}

function parseElements(buffer, cursor) {
    const element = parseElement(buffer, cursor);
    if (element) {
        if (buffer[element.cursor] === ",") {
            const elements = parseElements(buffer, element.cursor + 1);
            if (elements) {
                return {
                    value: [element.value, ...elements.value],
                    cursor: elements.cursor
                };
            } else {
                return null;
            }
        } else {
            return {
                value: [element.value],
                cursor: element.cursor
            }
        }
    }
    return null;
}

function parseElement(buffer, cursor) {
    const ws = parseWs(buffer, cursor);
    const value = parseValue(buffer, ws.cursor);
    if (value) {
        const ws2 = parseWs(buffer, value.cursor);
        return {
            value: value.value,
            cursor: ws2.cursor
        };
    } else {
        return null;
    }
}

function parseString(buffer, cursor) {
    if (buffer[cursor] === '"') {
        const characters = parseCharacters(buffer, cursor + 1);
        if (buffer[characters.cursor] === '"') {
            return {
                value: characters.value,
                cursor: characters.cursor + 1
            };
        }
    }
    return null;
}

function parseCharacters(buffer, cursor) {
    const character = parseCharacter(buffer, cursor);
    if (character) {
        const characters = parseCharacters(buffer, character.cursor);
        return {
            value: character.value + characters.value,
            cursor: characters.cursor
        };
    } else {
        return {
            value: "",
            cursor: cursor
        };
    }
}

function parseCharacter(buffer, cursor) {
    const char = buffer[cursor];
    if (char === "\\") {
        const escape = parseEscape(buffer, cursor + 1);
        if (escape) {
            return escape;
        }
    } else {
        if (char !== '"') {
            return {
                value: char,
                cursor: cursor + 1
            };
        }
    }
    return null;
}

function parseEscape(buffer, cursor) {
    const char = buffer[cursor];
    switch (char) {
        case '"':
            return {
                value: '"',
                cursor: cursor + 1
            };
        case "\\":
            return {
                value: "\\",
                cursor: cursor + 1
            };
        case "\/":
            return {
                value: "\/",
                cursor: cursor + 1
            };
        case "b":
            return {
                value: "\b",
                cursor: cursor + 1
            };
        case "f":
            return {
                value: "\f",
                cursor: cursor + 1
            };
        case "n":
            return {
                value: "\n",
                cursor: cursor + 1
            };
        case "r":
            return {
                value: "\r",
                cursor: cursor + 1
            };
        case "t":
            return {
                value: "\t",
                cursor: cursor + 1
            };
        case "u":
            const hex1 = parseHex(buffer, cursor + 1);
            const hex2 = parseHex(buffer, cursor + 2);
            const hex3 = parseHex(buffer, cursor + 3);
            const hex4 = parseHex(buffer, cursor + 4);
            const code = ((((hex1.value * 16) + hex2.value) * 16) + hex3.value) * 16 + hex4.value;
            return {
                value: String.fromCharCode(code),
                cursor: cursor + 5
            };
        default:
            return null;
    }
}

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
function parseHex(buffer, cursor) {
    const char = buffer[cursor];
    if ("0123456789abcdefABCDEF".indexOf(char)) {
        return {
            value: hexMap[char],
            cursor: cursor + 1
        };
    } else {
        return null;
    }
}

function parseWs(buffer, cursor) {
    const char = buffer[cursor]
    if (char === "\u0020" ||
        char === "\u000A" ||
        char === "\u000D" ||
        char === "\u0009") {
        // Could use while loop instead
        const ws = parseWs(buffer, cursor + 1);
        return {
            value: char + ws.value,
            cursor: ws.cursor
        };
    }
    return {
        value: "",
        cursor: cursor
    };
}

function parseNumber(buffer, cursor) {
    const integer = parseInteger(buffer, cursor);
    if (integer) {
        const fraction = parseFraction(buffer, integer.cursor);
        if (fraction) {
            const exponent = parseExponent(buffer, fraction.cursor);
            if (exponent) {
                return {
                    value: Number(integer.value + fraction.value + exponent.value),
                    cursor: exponent.cursor
                };
            }
        }
        return {
            value: Number(integer.value + fraction.value),
            cursor: fraction.cursor
        };
    } else {
        return null;
    }
}

function parseFraction(buffer, cursor) {
    if (buffer[cursor] === ".") {
        const digits = parseDigits(buffer, cursor + 1);
        if (digits) {
            return {
                value: "." + digits.value,
                cursor: digits.cursor
            };
        }
    }
    return {
        value: "",
        cursor: cursor
    };
}

function parseExponent(buffer, cursor) {
    if (buffer[cursor] === "e" || buffer[cursor] === "E") {
        const sign = parseSign(buffer, cursor + 1);
        if (sign) {
            const digits = parseDigits(buffer, sign.cursor);
            if (digits) {
                return {
                    value: "e" + sign.value + digits.value,
                    cursor: digits.cursor
                };
            }
        }
    }
    return {
        value: "",
        cursor: cursor
    };
}

function parseSign(buffer, cursor) {
    if (buffer[cursor] === "-") {
        return {
            value: "-",
            cursor: cursor + 1
        };
    }
    return {
        value: "",
        cursor: cursor
    };
}

function parseInteger(buffer, cursor) {
    if (buffer[cursor] === "-") {
        // try integer -> "-" onenine digits first
        const oneNine = parseOneNine(buffer, cursor + 1);
        if (oneNine) {
            const digits = parseDigits(buffer, oneNine.cursor);
            if (digits) {
                return {
                    value: "-" + oneNine.value + digits.value,
                    cursor: digits.cursor
                };
            }
        }
        
        // try integer -> "-" digit
        const digit = parseDigit(buffer, cursor + 1);
        if (digit) {
            return {
                value: "-" + digit.value,
                cursor: digit.cursor
            };
        } else {
            return null;
        }
    }
    
    // try integer -> onenine digits first
    const oneNine = parseOneNine(buffer, cursor);
    if (oneNine) {
        const digits = parseDigits(buffer, oneNine.cursor);
        if (digits) {
            return {
                value: oneNine.value + digits.value,
                cursor: digits.cursor
            };
        }
    }

    // try integer -> digit
    return parseDigit(buffer, cursor);
}

function parseDigit(buffer, cursor) {
    if ("0123456789".indexOf(buffer[cursor]) !== -1) {
        return {
            value: buffer[cursor], 
            cursor: cursor + 1
        };
    } else {
        return null;
    }
}

function parseOneNine(buffer, cursor) {
    if ("123456789".indexOf(buffer[cursor]) !== -1) {
        return {
            value: buffer[cursor], 
            cursor: cursor + 1
        };
    } else {
        return null;
    }
}

function parseDigits(buffer, cursor) {
    let digits = "";
    while (true) {
        const digit = parseDigit(buffer, cursor);
        if (digit) {
            digits += digit.value;
            cursor = digit.cursor;
        } else {
            if (digits === "") {
                return null;
            } else {
                return {
                    value: digits,
                    cursor: cursor
                };
            }
        }
    }
}