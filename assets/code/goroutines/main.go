package main

import (
	"fmt"
	"time"
)

// Simula um garçom chamando números da fila
func chamarFila(nome string, ch chan string) {

	for i := range 3 {
		ch <- fmt.Sprintf(
			"%s chamando número %d", nome, i+1)

		// Espera 0.1 seg
		time.Sleep(100 * time.Millisecond)
	}

	close(ch)
}

func main() {

	// Cria um canal pra enviar mensagens em string
	canal := make(chan string)

	// Inicia a função chamarFila em paralelo
	go chamarFila("Alan  ", canal)
	go chamarFila("Juan  ", canal)
	go chamarFila("Luan  ", canal)
	go chamarFila("Mateus", canal)
	go chamarFila("Vitor ", canal)

	// Recebe e imprime as mensagens enviadas
	for mensagem := range canal {
		fmt.Println(mensagem)
	}
}
