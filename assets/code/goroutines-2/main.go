package main

import (
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"sync"
	"time"
)

func SingleThreaded(arr []int) (sum int) {
	for _, v := range arr {
		sum += v
	}

	return
}

func _PartialSum(arr []int, resch chan int, wg *sync.WaitGroup) {
	defer wg.Done()

	var sum int
	for _, v := range arr {
		sum += v
	}
	resch <- sum
}

func MultiThreaded(arr []int) int {

	const chunk_size = 1024
	num_workers := len(arr) / chunk_size

	resch := make(chan int, num_workers+1)
	var wg sync.WaitGroup

	for i := range num_workers {
		start := i * chunk_size
		end := start + chunk_size

		chunk := arr[start:end]

		wg.Add(1)
		go _PartialSum(chunk, resch, &wg)
	}

	{
		left_over := arr[chunk_size*num_workers:]

		if len(left_over) >= 0 {
			wg.Add(1)
			go _PartialSum(left_over, resch, &wg)
		}
	}

	wg.Wait()
	close(resch)

	var total int
	for part := range resch {
		total += part
	}

	return total
}

func BenchMark(fn func([]int) int, arr []int) (int, time.Duration) {
	start := time.Now()

	sum := fn(arr)

	return sum, time.Since(start)
}

func main() {

	if len(os.Args) < 2 {
		return
	}

	size, err := strconv.Atoi(os.Args[1])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return
	}

	if size <= 0 {
		fmt.Fprintln(os.Stderr, "the informed number must be >0")
		return
	}

	arr := make([]int, size)
	var sum int

	for i := range size {
		// rand in [-size, size)
		arr[i] = rand.Intn(2*size) - size
		sum += arr[i]
	}

	ssum, stt := BenchMark(SingleThreaded, arr)
	msum, mtt := BenchMark(MultiThreaded, arr)

	if ssum != sum {
		fmt.Printf("the single-threaded sum, %d, is different from %d\n", ssum, sum)
	}

	if msum != sum {
		fmt.Printf("the multi-threaded sum, %d, is different from %d\n", msum, sum)
	}

	fmt.Printf(
		"Singlethreaded: %dμs\n",
		stt.Microseconds())

	fmt.Printf(
		"Multithreaded:  %dμs\n",
		mtt.Microseconds())
}
