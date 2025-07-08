type TokenKind = "keyword" | "identifier" | "operator" | "punctuation" | "comment" | "string" | "number" | "boolean" | "nil" | "whitespace" | "unknown"

class Token {
    kind: TokenKind
    slice: string

    constructor(kind: TokenKind, slice: string) {
        this.kind = kind
        this.slice = slice
    }

    equals(kind: TokenKind, slice: string): boolean {
        return this.kind === kind && this.slice === slice
    }
}

const PATTERNS: [RegExp, TokenKind][] = [
    [/^\/\/.*/, "comment"],
    [/^\/\*[\s\S]*?\*\//, "comment"],

    [/^(\r?\n|\s+)/, "whitespace"],

    [/^`(.|\r?\n)*?`/, "string"],
    [/^"([^"\\\r\n]|\\([abfnrtv\\'"]|[0-7]{3}|x[0-9A-Fa-f]{2}|(u|U[0-9A-Fa-f]{4})[0-9A-Fa-f]{4}))*?"/, "string"],
    [/^'([^'\\\r\n]|\\([abfnrtv\\'"]|[0-7]{3}|x[0-9A-Fa-f]{2}|(u|U[0-9A-Fa-f]{4})[0-9A-Fa-f]{4}))'/, "string"],

    [/^(\d(_?\d)*(\.(\d(_?\d)*)?|(\.(\d(_?\d)*)?)?[eE][-+]\d(_?\d)*)|\.\d(_?\d)*([eE][-+]\d(_?\d)*)?)i?/, "number"],
    [/^0[xX](_?[0-9A-Fa-f](_?[0-9A-Fa-f])*(\.([0-9A-Fa-f](_?[0-9A-Fa-f])*)?)?|\.[0-9A-Fa-f](_?[0-9A-Fa-f])*)[pP][-+]?\d(_?\d)*i?/, "number"],
    [/^0[xX](_?[0-9A-Fa-f])*i?/, "number"],
    [/^0[bB](_?[01])*i?/, "number"],
    [/^0[oO]?(_?[0-7])*i?/, "number"],
    [/^(0|[1-9](_?[0-9])*)i?/, "number"],

    [/^\b(true|false)\b/, "boolean"],

    [/^\bnil\b/, "nil"],

    [/^\b(break|c(ase|han|on(st|tinue))|def(ault|er)|else|f(allthrough|or|unc)|go(to)?|i(f|mport|nterface)|map|package|r(ange|eturn)|s((ele|tru)ct|witch)|type|var)\b/, "keyword"],

    [/^(\+\+|--|&&|\|\||<-|->|(<<|>>|&\^)=?|\.{3}|[\+\-\*\/%&\|^<>!:=]=?|[~\.,;()\[\]{}])/, "operator"],

    [/^\b[\p{L}_][\p{L}_0-9]*\b/u, "identifier"],
]

function push(token_stream: Token[], new_token: Token): number {
    token_stream.push(new_token)
    return new_token.slice.length
}

function lex(input: string): Token[] {

    const token_stream: Token[] = []

    let index = 0
    outer: while (index < input.length) {

        for (let i = 0; i < PATTERNS.length; i++) {
            const pattern = PATTERNS[i]

            const substring = input.substring(index)
            const result = substring.match(pattern[0])

            if (result !== null) {
                index += push(token_stream, new Token(pattern[1], result[0]))

                continue outer
            }
        }

        index += push(token_stream, new Token("unknown", input.substring(index, index + 1)))
    }

    return token_stream
}

function highlight(source: HTMLElement): void {

    const input = source.textContent
    if (input === null) {
        return
    }

    const token_stream = lex(input)
    source.classList.add("go-source")
    source.replaceChildren()

    for (let i = 0; i < token_stream.length; i++) {
        const token = token_stream[i]


        const token_element = document.createElement("span")
        token_element.textContent = token.slice
        token_element.classList.add("token", token.kind)

        if (token.kind === "whitespace") {
            token_element.textContent = token.slice.replace(/\r/g, "")
        }

        if (token.kind === "identifier") {
            if (i + 1 < token_stream.length && token_stream[i + 1].equals("operator", "(")) {
                token_element.classList.add("function")
            }
        }

        source.append(token_element)
    }
}

export { highlight }