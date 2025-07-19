/**
 * Represents the response from running code.
 * @type { output: (string | Node)[], exitcode: number }
 */
type RunResponse = {
    output: (string | Node)[]
    exitcode: number
}

/**
 * Creates a new RunResponse object.
 * 
 * @param output the output string from the response.
 * @returns a RunResponse object with the given output and exitcode as NaN.
 */
function new_error_response(...output: (string | Node)[]): RunResponse {
    return { output: output, exitcode: NaN }
}

/**
 * A constant representing a bad response.
 * @type {RunResponse}
 */
const BAD_RESPONSE: RunResponse = new_error_response("Error: bad response")

/**
 * Decodes the base64-encoded output in the result object.
 * 
 * @param result an object containing an "output" property as a base64 string.
 * @returns true if decoding was successful, false otherwise.
 */
function decode_reponse(result: { "output": string }): boolean {
    const output = from_base64(result.output)
    if (output === null) {
        return false
    }

    result.output = output
    return true
}

/**
 * Sends Go code to the backend for execution and returns the result.
 * 
 * @param code the Go code to execute.
 * @param args additional arguments to pass to the Go program.
 * @returns a promise that resolves to a RunResponse object.
 */
async function run_go_code(code: string, ...args: string[]): Promise<RunResponse> {

    const body = JSON.stringify({ code, args })

    const config = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
    }

    const result = await fetch("/gorun", config)
    if (!result.ok) {
        if (result.status === 405) {
            const anchor = document.createElement("a")
            anchor.href = "https://github.com/alan-b-lima/pl-go?tab=readme-ov-file#running-the-project"
            anchor.textContent = "o README do projeto"

            return new_error_response(
                "Você deve estar na versão estática da página, não é possível rodar código aqui, confira ",
                anchor, " para mais informações sobre como rodar código.")
        }

        return new_error_response(`Error: ${result.status} ${result.statusText}`)
    }

    const response = await result.json()
    if ("output" in response) {
        decode_reponse(response)
        return response
    }

    return BAD_RESPONSE
}

/**
 * Encodes a string to base64.
 * 
 * @param input the input utf-8 string to encode.
 * @returns the base64-encoded string, or null if encoding fails.
 */
function to_base64(input: string): string | null {
    try {

        const utf8_bytes = new TextEncoder().encode(input)
        const binary = String.fromCharCode(...utf8_bytes)

        return btoa(binary)

    } catch {
        return null;
    }
}

/**
 * Decodes a base64-encoded string.
 * 
 * @param input the base64-encoded string to decode.
 * @returns the decoded utf-8 string, or null if decoding fails.
 */
function from_base64(input: string): string | null {
    try {

        const binary = Uint8Array.from(atob(input), c => c.charCodeAt(0))
        return new TextDecoder().decode(binary)

    } catch (err) {
        console.error(err)
        return null
    }
}

export { run_go_code }
