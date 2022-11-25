// "use strict";

// low budget module system, go!
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;

const WHITESPACES = {' ':true, '\n':true, '\t':true, '\r':true, '\v':true};
const is_whitespace = function(char) {
	return WHITESPACES[char];
};
const is_digit = function(char) {
    return char >= "0" && char <= "9";
};
const is_barewordable = function(char) {
    return char.match(/[-A-Za-z0-9_.$!#]/);
};
const OPERATORS_SINGLE = {
	"{":true,
	"}":true,
	"(":true,
	")":true,
	"=":true,
	">":true,
	"<":true,
	"%":true,
	"?":true,
	":":true,
	"+":true,
	"/":true,
	"*":true,
    "-":true,
};
const is_single_char_operator = function(char) {
    return OPERATORS_SINGLE[char];
};

// Barewords that carry some special significance
const WORDS_WITH_TYPES = {
    "on": {"type":"boolean","value":true},
    "off": {"type":"boolean","value":false},
    "yes": {"type":"boolean","value":true},
    "no": {"type":"boolean","value":false},
    "true": {"type":"boolean","value":true},
    "false": {"type":"boolean","value":false},
    "open": {"type":"boolean","value":true},
    "close": {"type":"boolean","value":false},
    "black": {"type":"color","value":"#000000"},
    "white": {"type":"color","value":"#FFFFFF"},
    "once": {"type":"quantity","value":1},
    "twice": {"type":"quantity","value":2},
    "thrice": {"type":"quantity","value":3},
};

const BAREWORD_DECORATORS = [
    function(inword) {
        if(inword.match(/^#[0-9A-Fa-f]{3}/) || inword.match(/^#[0-9A-Fa-f]{6}/))
            return {"type":"color","value":inword}
        else
            return null;
    },
];

const NUMBER_SUFFIXES = {
    "ms": function(num) { return {"type":"duration","value":num} },
    "s": function(num) { return {"type":"duration","value":num*1000} },
    "px": function(num) { return {"type":"distance","value":num} },
    "pix": function(num) { return {"type":"distance","value":num} },
    "x": function(num) { return {"type":"quantity","value":num} },
};

const LONG_OPERATORS = [ "==", ">=", "<=", "||", "->" ];

natlang.lex = function (inputString) {
	let pos = 0;
    let tokens = [];
    let errors = [];
    bigloop: while(pos < inputString.length) {
        let nextChar = inputString[pos];
        // Eat as much whitespace as we can.
        while(is_whitespace(nextChar)) {
            pos += 1;
            nextChar = inputString[pos];
        }
        if(pos >= inputString.length) break; // All done
        // Something is next, and it's not whitespace!
        let startPos = pos;
        if(nextChar == "/") {
            // It might be a comment.
            if(inputString[pos+1] == "/") {
                // Single-line comment. Eat characters until newline.
                pos += 2;
                while(pos < inputString.length && inputString[pos] != '\n') ++pos;
                continue;
            }
            else if(inputString[pos+1] == "*") {
                // Multi-line comment. Eat characters until "*/"
                pos += 2;
                while(pos < inputString.length && inputString.substring(pos, pos+2) != "*/") {
                    ++pos;
                }
                if(inputString.substring(pos, pos+2) == "*/") {
                    pos += 2;
                    // All OK
                    continue;
                }
                else {
                    errors.push({"pos":startPos,"text":"Lexer: Unterminated comment"});
                    break;
                }
            }
            // It wasn't "//" or "/*", so it's not a comment.
        }
        // Are we looking at a digit?
        if(is_digit(nextChar)) {
            pos += 1;
            // So we've had at least one. How many more?
            while(pos < inputString.length && is_digit(inputString[pos]))
                pos += 1;
            // Here is our number.
            let numberString = inputString.substring(startPos, pos);
            // There might be a suffix. Let's consume it.
            let suffixStartPos = pos;
            while(pos < inputString.length && is_barewordable(inputString[pos]))
                pos += 1;
            // Validate the number.
            while(numberString.startsWith("0") && numberString.length > 1) {
                numberString = numberString.substring(1);
            }
            let number = parseInt(numberString);
            if(number+"" != numberString) {
                errors.push({"pos":startPos,"text":"Lexer: This number didn't parse, is it perhaps way too big?"});
                continue; // don't bother trying to check the suffix if this happened
            }
            let suffix = inputString.substring(suffixStartPos, pos);
            if(suffix == "") {
                if( // If there was a token before us
                    tokens.length > 0 
                    // AND it was an operator
                    && tokens[tokens.length-1].type === "operator"
                    // AND it was specifically the minus operator
                    && tokens[tokens.length-1].value === "-"
                    // AND there was NOT a space between us
                    && tokens[tokens.length-1].pos === startPos-1
				) {
                    // ...then erase that token and make it part of ourselves.
                    tokens.pop();
                    number = -number; // :)
                }
                tokens.push({"pos":startPos,"type":"number","value":number});
            }
            else {
				let suffix_handler = NUMBER_SUFFIXES[suffix];
				let result = null;
				if(suffix_handler != undefined) {
					result = suffix_handler(number);
				}
				if(result != null) {
					result.pos = startPos;
					// change to barewordValue if you decide you want numbers
					// to be valid barewords after all
					// (and add one to the empty-suffix case as well)
					result.originalValue = inputString.substring(startPos, pos);
					tokens.push(result);
					continue;
				}
                errors.push({"pos":suffixStartPos,"text":"Lexer: Unknown numerical suffix"});
                tokens.push({"pos":startPos,"type":"number","value":number});
            }
            continue;
        }
        // Are we looking at a bareword?
        if(is_barewordable(nextChar) && nextChar != "-") { // barewords can't start with "-"
            pos += 1;
            while(pos < inputString.length && is_barewordable(inputString[pos]))
                pos += 1;
            let bareword = inputString.substring(startPos, pos);
            let special_case = WORDS_WITH_TYPES[bareword];
            if(special_case != undefined) {
                // anything in the WORDS_WITH_TYPES map gets a "barewordValue" with its original value,
                // unless it explicitly nulled it out (like "-" did)
                let obj = {"pos":startPos,"barewordValue":bareword};
                Object.assign(obj, special_case);
                tokens.push(obj);
            }
            else {
                for(let n = 0; n < BAREWORD_DECORATORS.length; ++n) {
                    let result = BAREWORD_DECORATORS[n](bareword);
                    if(result != null) {
                        result.pos = startPos;
                        result.barewordValue = bareword;
                        tokens.push(result);
                        continue bigloop;
                    }
                }
                // if we get here, it's "just" a bareword.
                tokens.push({"pos":startPos,"type":"bareword","value":bareword});
            }
            continue;
        }
        // Is it a quote?
        if(nextChar == '"' || nextChar == "'") {
            let quotationMark = nextChar;
            let outString = "";
            pos += 1;
            while(pos < inputString.length) {
                nextChar = inputString[pos];
                pos += 1;
                if(nextChar == "\\") {
                    nextChar = inputString[pos];
                    if((nextChar >= "A" && nextChar <= "Z")
                    || (nextChar >= "a" && nextChar <= "z")
                    || (nextChar >= "0" && nextChar <= "9")) {
                        // Special meaning
                        if(nextChar == "n") {
                            outString += "\n";
                        } else if(nextChar == "t")
							outString += "\t";
                        else {
                            errors.push({"pos":pos,"text":"Lexer: Unrecognized escape sequence"});
                            outString += "\uFFFD";
                        }
                    }
                    else {
                        // Just literally put the next character
                        outString += nextChar;
                    }
                    pos += 1;
                }
                else if(nextChar == quotationMark) {
                    break;
                }
                else {
                    outString += nextChar;
                }
            }
            if(nextChar != quotationMark) {
                errors.push({"pos":startPos,"text":"Lexer: Unterminated quoted string"});
                break;
            }
            tokens.push({"pos":startPos,"type":"quotedString","value":outString,"quotationMark":quotationMark});
            continue;
        }
        // Is it one of the operators we know about?
        for(let n = 0; n < LONG_OPERATORS.length; ++n) {
            let operator = LONG_OPERATORS[n];
            if(inputString.substring(pos, pos+operator.length) == operator) {
                tokens.push({"pos":startPos,"type":"operator","value":operator});
                pos += operator.length;
                continue bigloop;
            }
        }
        // check single-character operators AFTER longer ones
        if(is_single_char_operator(nextChar)) {
            tokens.push({"pos":startPos,"type":"operator","value":nextChar});
            pos += 1;
            continue;
        }
        // It's an error!
        errors.push({"pos":startPos,"text":"Unrecognized character (do you need quotes?)"});
        break;
    }
    if(errors.length > 0) {
        return {"success":false,"errors":errors}
    }
    else {
        return {"success":true,"tokens":tokens}
    }
};

if (typeof module === 'object') {
	module.exports = natlang.lex
}
