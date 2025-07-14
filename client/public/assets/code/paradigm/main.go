package main

import "fmt"

type Pessoa struct {
	nome string
	cpf  string
}

func (p *Pessoa) Cumprimenta() func() {
	return func() {
		fmt.Printf("Olá, %s!\n", p.nome)
	}
}

type Cliente struct {
	código int
	Pessoa
}

func main() {
	c := Cliente{
		1,
		Pessoa{"Mateus", "987.654.321-00"},
	}

	c.Cumprimenta()()
}
