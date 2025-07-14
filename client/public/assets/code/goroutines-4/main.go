package main

import (
	"fmt"
	"os"
	"strconv"
	"sync"
)

// Simula um garçom chamando números de pedidos'
func lançarGarçom(nome string, pedidos chan int, atendims chan string, wg *sync.WaitGroup) {
	defer wg.Done()
	for pedido := range pedidos {
		atendims <- fmt.Sprintf(
			"%s atendeu o pedido %d", nome, pedido)
	}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("informe o número de pedidos")
		os.Exit(1)
	}

	pedidos := make(chan int)
	atendims := make(chan string)
	var wg sync.WaitGroup

	// Cria 5 garçons
	wg.Add(5)
	go lançarGarçom("Alan  ", pedidos, atendims, &wg)
	go lançarGarçom("Juan  ", pedidos, atendims, &wg)
	go lançarGarçom("Luan  ", pedidos, atendims, &wg)
	go lançarGarçom("Mateus", pedidos, atendims, &wg)
	go lançarGarçom("Vitor ", pedidos, atendims, &wg)

	// Verifica se o número de pedidos é válido
	núm, err := strconv.Atoi(os.Args[1])
	if err != nil || núm <= 0 {
		fmt.Println("número de pedidos inválido")
		os.Exit(1)
	}

	// Envia pedidos
	go func() {
		for i := 1; i <= núm; i++ {
			pedidos <- i
		}
		close(pedidos)
	}()

	// Fecha as mensagens quando todos garçons terminarem
	go func() {
		wg.Wait()
		close(atendims)
	}()

	// Consome as mensagens
	for mensagem := range atendims {
		fmt.Println(mensagem)
	}
}
