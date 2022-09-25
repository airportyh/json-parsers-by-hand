test();

function test() {

    const testCases = [
        ["5", 5],
        ["123", 123],
        ["-12", -12],
        ["-6", -6],
        ["12.50", 12.50],
        ["-5.6", -5.6],
        ["abc", undefined]
    ];

    for (let testCase of testCases) {
        const output = parseJson(testCase[0], 0);
        if (output[0] === testCase[1]) {
            console.log(`Ok ${testCase[0]} = ${JSON.stringify(output[0])}`);
        } else {
            console.log(`Fail ${testCase[0]} = ${JSON.stringify(output[0])}, should be ${JSON.stringify(testCase[1])}`);
            console.log(output);
        }
    }
    
}

function parseJson(buffer, cursor) {
    const [value, newCursor] = parseValue(buffer, cursor);
    if (value !== undefined) {
        return [value, newCursor];
    } else {
        return [undefined, cursor];
    }
}

function parseValue(buffer, cursor) {
    /*parseObject(buffer, cursor);
    parseArray(buffer, cursor);
    ...*/
    const [number, newCursor] = parseNumber(buffer, cursor);
    if (number !== undefined) {
        return [number, newCursor];
    } else {
        return [undefined, cursor];
    }
}

function parseNumber(buffer, cursor) {
    const [integer, newCursor] = parseInteger(buffer, cursor);
    const [fraction, newCursor2] = parseFraction(buffer, newCursor);
    
    if (integer !== undefined) {
        return [Number(integer + fraction), newCursor2];
    } else {
        return [undefined, cursor];
    }
}

function parseFraction(buffer, cursor) {
    if (buffer[cursor] === ".") {
        const [digits, newCursor] = parseDigits(buffer, cursor + 1);
        if (digits !== undefined) {
            return ["." + digits, newCursor];
        } else {
            return ["", cursor];
        }
    }
    return ["", cursor];
}

function parseInteger(buffer, cursor) {
    if (buffer[cursor] === "-") {
        // try integer -> "-" onenine digits first
        const [oneNine, newCursor] = parseOneNine(buffer, cursor + 1);
        if (oneNine !== undefined) {
            const [digits, newCursor2] = parseDigits(buffer, newCursor);
            if (digits !== undefined) {
                return ["-" + oneNine + digits, newCursor2];
            }
        }
        
        // try integer -> "-" digit
        const [digit, newCursor3] = parseDigit(buffer, cursor + 1);
        if (digit !== undefined) {
            return ["-" + digit, newCursor3];
        } else {
            return [undefined, cursor];
        }
    }
    
    // try integer -> onenine digits first
    const [oneNine, newCursor] = parseOneNine(buffer, cursor);
    if (oneNine !== undefined) {
        const [digits, newCursor2] = parseDigits(buffer, newCursor);
        if (digits !== undefined) {
            return [oneNine + digits, newCursor2];
        }
    }

    // try integer -> digit
    const [digit, newCursor3] = parseDigit(buffer, cursor);
    if (digit !== undefined) {
        return [digit, newCursor3];
    } else {
        return [undefined, cursor];
    }
}

function parseDigit(buffer, cursor) {
    if ("0123456789".indexOf(buffer[cursor]) !== -1) {
        return [buffer[cursor], cursor + 1];
    } else {
        return [undefined, cursor];
    }
}

function parseOneNine(buffer, cursor) {
    if ("123456789".indexOf(buffer[cursor]) !== -1) {
        return [buffer[cursor], cursor + 1];
    } else {
        return [undefined, cursor];
    }
}

function parseDigits(buffer, cursor) {
    let digits = "";
    while (true) {
        const [digit, newCursor] = parseDigit(buffer, cursor);
        if (digit !== undefined) {
            digits += digit;
            cursor = newCursor;
        } else {
            if (digits === "") {
                return [undefined, cursor];
            } else {
                return [digits, cursor];
            }
        }
    }
}