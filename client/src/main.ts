import { highlight } from "./lexer.js"
import { run_go_code } from "./run-api.js"

type Presentation = {
    slides: HTMLElement[],
    index: number,
    key_lock: boolean,
    playgrounds: Playground[],
    progresses: HTMLProgressElement[],
}

type Playground = {
    input: HTMLElement,
    args: HTMLInputElement,
    submit: HTMLInputElement,
    output: HTMLElement,
}

const state: Presentation = {
    slides: [], index: 0,
    key_lock: false,
    playgrounds: [],
    progresses: [],
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

    const playgrounds = document.querySelectorAll(".playground")
    for (let i = 0; i < playgrounds.length; i++) {
        state.playgrounds.push({
            input: playgrounds[i].querySelector(".input")!,
            args: playgrounds[i].querySelector(".args")!,
            submit: playgrounds[i].querySelector(".submit")!,
            output: playgrounds[i].querySelector(".output")!,
        })

        state.playgrounds[i].input.contentEditable = "plaintext-only"
        state.playgrounds[i].input.addEventListener("keydown", on_input_keydown)

        playgrounds[i].addEventListener("focusin", evt => { state.key_lock = true })
        playgrounds[i].addEventListener("focusout", evt => { state.key_lock = false })

        state.playgrounds[i].submit.addEventListener("click", () => {
            on_run(state.playgrounds[i])
        })

        playgrounds[i].addEventListener("keydown", evt => {
            const kbevt = evt as KeyboardEvent
            if (kbevt.key === "Enter" && kbevt.ctrlKey) {
                on_run(state.playgrounds[i])
            }
        })
    }

    const progresses = document.querySelectorAll("progress")
    for (let i = 0; i < progresses.length; i++) {
        state.progresses.push(progresses[i])

        progresses[i].max = state.slides.length
        progresses[i].addEventListener("click", on_progress_bar_click)
    }

    const index = localStorage.getItem("slide index")
    change_to(index !== null ? Number.parseInt(index) : 0)

    window.addEventListener("keydown", on_arrow_keydown)
}

function setup_code_blocks() {
    const code_blocks = document.querySelectorAll("code[data-source]")

    for (let i = 0; i < code_blocks.length; i++) {

        const source = code_blocks[i].getAttribute("data-source")
        if (source === null) {
            continue
        }

        load_source_file(source).then(result => {
            code_blocks[i].textContent = result
            highlight(code_blocks[i] as HTMLElement)
        })

        code_blocks[i].addEventListener("input", on_code_input)
    }
}

async function load_source_file(filename: string): Promise<string> {
    try {
        const response = await fetch(filename)
        if (!response.ok) {
            return ""
        }

        return await response.text();
    } catch (error) {
        return ""
    }
}

function change_to(index: number): void {

    state.index = Math.max(0, Math.min(index, state.slides.length - 1))

    for (let i = 0; i < state.slides.length; i++) {
        state.slides[i].classList.remove("current")
    }
    state.slides[state.index].classList.add("current")

    state.progresses.forEach(p => {
        p.value = state.index + 1
    })
    localStorage.setItem("slide index", `${state.index}`)
}

function on_progress_bar_click(evt: MouseEvent): void {
    const ratio = evt.offsetX / (evt.target! as HTMLElement).clientWidth
    const index = Math.floor(state.slides.length * ratio)
    change_to(index)
}

function on_arrow_keydown(evt: KeyboardEvent): void {

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

function on_input_keydown(evt: KeyboardEvent): void {

    if (evt.key !== "Tab") {
        return
    }

    evt.preventDefault()

    const selection = window.getSelection()
    if (selection === null || selection.rangeCount <= 0) {
        return
    }

    const range = selection.getRangeAt(0)
    const tab = document.createTextNode("\t")

    range.insertNode(tab)
    range.setStartAfter(tab)
    range.setEndAfter(tab)

    selection.removeAllRanges()
    selection.addRange(range)
}

function on_run(playground: Playground): void {

    const code = playground.input.textContent ?? ""

    const arg_params = playground.args.value
    const args: string[] = /^\s*$/.test(arg_params)
        ? []
        : Array.from(arg_params.match(/[^\s]+/g)!)

    playground.output.replaceChildren()

    run_go_code(code, ...args).then(result => {
        playground.output.append(...result.output)
    })
}

function on_code_input(evt: Event): void {

    const inevt = evt as InputEvent
    const target = inevt.target as HTMLElement

    const selection = window.getSelection()
    if (selection === null || selection.rangeCount <= 0) {
        return
    }

    const range = selection.getRangeAt(0)

    if (!target.contains(range.startContainer)) {
        return
    }

    const pre_caret_range = range.cloneRange()
    pre_caret_range.selectNodeContents(target)
    pre_caret_range.setEnd(range.startContainer, range.startOffset)

    const cursor_offset = pre_caret_range.toString().length

    highlight(target)

    let input_offset = 0
    for (let i = 0; i < target.childNodes.length; i++) {

        const node = target.childNodes[i].firstChild as Text
        if (!(node instanceof Text)) {
            console.error("bad node")
            return
        }

        const next_input_offset = input_offset + node.length

        if (cursor_offset > next_input_offset) {
            input_offset = next_input_offset
            continue
        }

        const selection = window.getSelection()
        if (selection === null) {
            return
        }
        const range = document.createRange()

        range.setStart(node, cursor_offset - input_offset)
        range.collapse(true)

        selection.removeAllRanges()
        selection.addRange(range)

        return
    }
}

export { on_code_input }

window.addEventListener("load", main)