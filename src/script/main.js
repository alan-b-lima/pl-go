import { highlight } from "/script/dist/lexer.js"
import { run_go_code } from "/script/dist/run-api.js"

const state = {
    slides: [],
    index: 0,
    key_lock: false,

    progress_bar: undefined,
    playgrounds: []
}

function main() {

    state.slides = [].slice.call(document.querySelectorAll(".slide"))
    if (state.slides.length === 0) {
        alert("Empty!")
        return;
    }

    for (let i = 0; i < state.slides.length; i++) {
        const page_number = state.slides[i].querySelector('.page-number')
        if (page_number !== null) {
            page_number.textContent = `${i + 1}`
        }
    }

    setup_code_blocks()

    const playgrounds = [].slice.call(document.querySelectorAll(".playground"))
    for (let i = 0; i < playgrounds.length; i++) {
        state.playgrounds.push({
            input: playgrounds[i].querySelector(".input"),
            args: playgrounds[i].querySelector(".args"),
            submit: playgrounds[i].querySelector(".submit"),
            output: playgrounds[i].querySelector(".output"),
        })

        state.playgrounds[i].input.contentEditable = "plaintext-only"
        state.playgrounds[i].input.addEventListener("keydown", on_input_keydown)

        playgrounds[i].addEventListener("focusin", evt => { state.key_lock = true })
        playgrounds[i].addEventListener("focusout", evt => { state.key_lock = false })

        state.playgrounds[i].submit.addEventListener("click", () => {
            on_run(state.playgrounds[i])
        })

        playgrounds[i].addEventListener("keydown", evt => {
            if (evt.key === "Enter" && evt.ctrlKey) {
                on_run(state.playgrounds[i])
            }
        })
    }

    state.progress_bar = document.querySelector("progress")
    state.progress_bar.max = state.slides.length
    state.progress_bar.addEventListener("click", on_progress_bar_click)

    const index = localStorage.getItem("slide index")
    change_to(index !== null ? Number.parseInt(index) : 0)

    window.addEventListener("keydown", on_arrow_keydown)
}

function setup_code_blocks() {
    const code_blocks = document.querySelectorAll("code[data-source]")

    for (let i = 0; i < code_blocks.length; i++) {
        load_source_file(code_blocks[i].getAttribute("data-source"))
            .then(result => {
                code_blocks[i].textContent = result
                highlight(code_blocks[i])
            })

        code_blocks[i].addEventListener("input", on_code_input)
    }
}

async function load_source_file(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            return ""
        }

        return await response.text();
    } catch (error) {
        return ""
    }
}

function change_to(index) {

    state.index = Math.max(0, Math.min(index, state.slides.length - 1))

    for (let i = 0; i < state.slides.length; i++) {
        state.slides[i].classList.remove("current")
    }
    state.slides[state.index].classList.add("current")

    state.progress_bar.value = state.index + 1
    localStorage.setItem("slide index", `${state.index}`)
}

function on_progress_bar_click(evt) {
    const ratio = evt.offsetX / evt.target.clientWidth
    const index = Math.floor(state.slides.length * ratio)
    change_to(index)
}

function on_arrow_keydown(evt) {

    if (state.key_lock && [
        "ArrowUp",
        "ArrowLeft",
        "ArrowDown",
        "ArrowRight",
        "Home",
        "End",
    ].includes(evt.key)) {
        return
    }

    switch (evt.key) {

        case "PageUp":
        case "ArrowUp":
        case "ArrowLeft": {
            evt.preventDefault()
            change_to(state.index - 1)
        } break

        case "PageDown":
        case "ArrowDown":
        case "ArrowRight": {
            evt.preventDefault()
            change_to(state.index + 1)
        } break

        case "Home": {
            change_to(0)
        } break

        case "End": {
            change_to(state.slides.length - 1)
        } break
    }
}

function on_input_keydown(evt) {

    switch (evt.key) {
        case "Tab": {
            evt.preventDefault()

            const selection = window.getSelection()
            if (selection === null || selection.rangeCount <= 0) {
                return
            }

            const range = selection.getRangeAt(0)
            const tabNode = document.createTextNode("\t")

            range.insertNode(tabNode)
            range.setStartAfter(tabNode)
            range.setEndAfter(tabNode)

            selection.removeAllRanges()
            selection.addRange(range)
        } break

        case "(": {

        } break

        default: {
            // console.log(evt)
        } break
    }
}

function on_code_input(evt) {
    // Save cursor position
    const selection = window.getSelection();
    const range = selection.rangeCount ? selection.getRangeAt(0) : null;
    let cursorOffset = null;

    if (range && evt.target.contains(range.startContainer)) {
        // Calculate offset from the start of the element
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(evt.target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preCaretRange.toString().length;
    }

    highlight(evt.target);

    // Restore cursor position
    if (cursorOffset !== null) {
        let node = evt.target;
        let charIndex = 0;
        let found = false;

        setCursor(node);

        function setCursor(node) {
            if (node.nodeType === 3) { // Text node
                const nextCharIndex = charIndex + node.length;
                if (!found && cursorOffset <= nextCharIndex) {
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.setStart(node, cursorOffset - charIndex);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    found = true;
                }
                charIndex = nextCharIndex;
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    setCursor(node.childNodes[i]);
                    if (found) break;
                }
            }
        }
    }
}

function on_run(playground) {

    const code = playground.input.textContent
    const arg_params = playground.args.value

    const args = arg_params.search(/^\s*$/) === 0
        ? []
        : arg_params.match(/[^\s]+/g)

    playground.output.textContent = ""

    run_go_code(code, ...args).then(result => {
        playground.output.textContent = result.output
    })
}

window.addEventListener("load", main)