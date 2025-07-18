function new_run_response(output) {
    return { output, exitcode: NaN };
}
const BAD_RESPONSE = new_run_response("Error: bad response");
function decode_reponse(result) {
    const output = from_base64(result.output);
    if (output === null) {
        return false;
    }
    result.output = output;
    return true;
}
async function run_go_code(code, ...args) {
    const body = JSON.stringify({ code, args });
    const config = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
    };
    try {
        const result = await fetch("/gorun", config);
        if (!result.ok) {
            return new_run_response(`Erro: ${result.status} ${result.statusText}`);
        }
        const response = await result.json();
        if ("output" in response) {
            decode_reponse(response);
            return response;
        }
        return BAD_RESPONSE;
    }
    catch (error) {
        return new_run_response(`Erro: ${error}`);
    }
}
function to_base64(input) {
    try {
        const utf8_bytes = new TextEncoder().encode(input);
        const binary = String.fromCharCode(...utf8_bytes);
        return btoa(binary);
    }
    catch {
        return null;
    }
}
function from_base64(input) {
    try {
        const binary = Uint8Array.from(atob(input), c => c.charCodeAt(0));
        return new TextDecoder().decode(binary);
    }
    catch (err) {
        console.error(err);
        return null;
    }
}
export { run_go_code };
