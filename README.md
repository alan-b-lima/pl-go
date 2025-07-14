# Go Programming Language Presentation

This project has the main purpose of serving as presentation slides for a seminar about the Go Programming Language, but I has personally expended to be wide learning experience for me. It features a presentation with functional Go playground with a self-made Go syntatical highligher and code execution server.

## Motivation

This project started off as a last resource solution, because my PowerPoint free trial ended and I'm not a fan of the other alternatives. So, I started the presentation slides as a static HTML/CSS/JavaScript page. One of the requirements for the presentation is to present the programming language on a IDE and run some simple programs. Initially, I'd use VSCode, but one thing occurred to me, I could, theoretically, run code from the very presentation, just like is possible on the [Go tour](https://go.dev/tour). I had a basic idea of how to do that, since I have some experience with Node.js.

Since Go is language often used in BackEnd servers, and the presentation is about Go, I had my language of choice. So far I had done not much in the language, a [elementary cellular automaton](https://github.com/alan-b-lima/elementary_cellular_automaton) and two other in-progress side projects, neither of those three had nothing to do with networking. So, this is the result of a good idea that was also a fitting conclusion for the first semester of 2025.

## Structure

This project is structures in the following hierarchy:

```
├───client
│   ├───public
│   │   ├───assets
│   │   │   ├───code
│   │   │   │   └───...
│   │   │   └───images
│   │   │       └───...
│   │   ├───script
│   │   │   └───...
│   │   ├───style
│   │   │   ├───language.css
│   │   │   └───style.css
│   │   └───index.html
│   └───src
│       ├───lexer.ts
│       ├───main.ts
│       └───run-api.ts
└───server
    └───server.go
```

* `assets/code/`: code samples for the presentation;
* `assets/images/`: images for the presentation;
* `server/server.go`: source code for the server that both serves the files and runs the Go code on the playgrounds;
* `src/script`: the Front-End logic and API's used by the application:
    * `lexer.ts`: a simple syntatic lexer and highlighter for a subset of Go valid programs,
    * `main.ts`: the main script that handles the page logic, including the code editor and the API calls,
    * `run-api.ts`: the API that requests the execution of the Go code on the server;
* `src/style`: the stylesheets for the application:
    * `language.css`: the styles for the Go code syntax highlighter,
    * `style.css`: the main styles for the application.
* `src/index.html`: the main display page;

## Running the Project

To run the project, you need to have Go installed on your machine. You can download it from the [official Go website](https://go.dev/dl/). Once you have Go installed, you can run the server by executing the following command from the root directory of the project:

```
go run server/server.go [<port>]
```

It's important that you run the server from the root directory, because the server expects to find the `assets` and `src` directories in the same level as the `server` directory. After starting the server, you can access the presentation by opening your web browser and navigating to `http://localhost:<port>`, where `<port>` is the port you specified or `:8080` if you don't specify any port.
