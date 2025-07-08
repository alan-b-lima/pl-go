package main

import "fmt"

const Pi float64 = 3.14

var idade int = 21
var name string = "Alice"
var cpf = "123.456.789-09"

type Pessoa struct {
	Nome  string
	Idade int
}

func cumprimenta(p Pessoa) string {
	return "Olá, " + p.Nome
}

func (p *Pessoa) Cumprimenta() string {
	return cumprimenta(*p)
}

func main() {
	var pessoa = Pessoa{Nome: "Vitor", Idade: 20}
	fmt.Println(pessoa.Cumprimenta())
}
