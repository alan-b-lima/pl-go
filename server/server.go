package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"time"
)

type _RequestBody struct {
	Code string   `json:"code"`
	Args []string `json:"args"`
}

type _ResponseBody struct {
	Output   []byte `json:"output"`
	ExitCode int    `json:"exitcode"`
}

func _LaunchServer(addr string) {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /gorun", _GoRunHandler)

	_FileServe(mux, "/", "./client/public")
	_FileServe(mux, "/assets/code/server/", "./server")

	log.Printf("Server running at \033[38;2;234;154;12m%s\033[m", addr)

	server := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	err := server.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}

func _FileServe(mux *http.ServeMux, route, filename string) {
	handler := http.StripPrefix(route, http.FileServer(http.Dir(filename)))

	mux.HandleFunc("GET "+route, func(w http.ResponseWriter, r *http.Request) {
		log.Println("request from:", r.URL.Path)
		handler.ServeHTTP(w, r)
	})
}

var PortPattern = regexp.MustCompile(`^:\d+$`)

func main() {

	port := ":8080"

	if len(os.Args) > 1 {
		port = os.Args[1]

		if !PortPattern.MatchString(port) {
			fmt.Println("bad port, try \":<number>\"")
			return
		}

		num, _ := strconv.Atoi(port[1:])
		if num < 0 && 0xFFFF < num {
			fmt.Println("too high, try a 16-bit unsigned integer")
			return
		}
	}

	_LaunchServer(port)
}

func _GoRunHandler(w http.ResponseWriter, r *http.Request) {

	log.Println("request from:", r.Host)

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var c _RequestBody
	err = json.Unmarshal(body, &c)
	if err != nil {
		http.Error(w, "failed to parse the body", http.StatusBadRequest)
		return
	}

	tmpFile, err := os.CreateTemp("", "code-*.go")
	if err != nil {
		http.Error(w, "failed to create temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())

	_, err = tmpFile.Write([]byte(c.Code))
	if err != nil {
		http.Error(w, "failed to write file", http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	args := append([]string{"run", tmpFile.Name()}, c.Args...)
	cmd := exec.Command("go", args...)

	cmdOutput, _ := cmd.CombinedOutput()

	response := _ResponseBody{
		Output:   cmdOutput,
		ExitCode: cmd.ProcessState.ExitCode(),
	}

	j, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "failed to parse output", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(j)
}
