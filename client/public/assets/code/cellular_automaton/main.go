package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {

	if len(os.Args) < 2 {
		fmt.Println("You must inform a rule")
		os.Exit(1)
	}

	var rule int
	var err error

	rule, err = strconv.Atoi(os.Args[1])

	if err != nil {
		if os.Args[1] == "help" {
			fmt.Println(os.Args[0], "<rule>", "[<width>]")
			return
		}

		fmt.Println("The rule must be a number")
		os.Exit(1)
	}

	if rule < 0 || 255 < rule {
		fmt.Println("You must inform a rule between 0 and 255")
		os.Exit(1)
	}

	width := 52

	if len(os.Args) > 2 {

		if os.Args[2] == "max" {
			width = 238
		} else {
			width, err = strconv.Atoi(os.Args[2])

			if err != nil {
				fmt.Println("The width must be a number")
				os.Exit(1)
			}

			if width <= 0 {
				fmt.Println("The width must be a positive number")
				os.Exit(1)
			}
		}
	}

	fmt.Printf("Rendering rule %d\n", rule)

	generation := [2][]int8{
		make([]int8, width),
		make([]int8, width),
	}

	generation[0][(width-1)/2] = 1

	for y := range ((width + 3) / 2) & ^1 {
		top := generation[y&1][width-1]<<1 | generation[y&1][0]

		for x := range width - 1 {
			top = top&0b011<<1 | generation[y&1][x+1]

			if (rule & (1 << top)) != 0 {
				generation[^y&1][x] = 1
			} else {
				generation[^y&1][x] = 0
			}
		}

		top = top&0b011<<1 | generation[y&1][0]

		if (rule & (1 << top)) != 0 {
			generation[^y&1][width-1] = 1
		} else {
			generation[^y&1][width-1] = 0
		}

		if y&1 == 0 {
			for x := range width {
				switch generation[0][x]<<1 | generation[1][x] {

				case 0b00:
					fmt.Print("\u0020")
				case 0b01:
					fmt.Print("\u2584")
				case 0b10:
					fmt.Print("\u2580")
				case 0b11:
					fmt.Print("\u2588")
				}
			}

			fmt.Println()
		}
	}
}
