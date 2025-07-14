package main

import (
	"cmp"
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"sync"
	"time"
)

const LenghtThreshold = 32

func SingleThreadedQuickSort(arr []int) {

	if len(arr) <= LenghtThreshold {
		InsertionSort(arr)
		return
	}

	pivot := _Partition(arr)

	SingleThreadedQuickSort(arr[:pivot])
	SingleThreadedQuickSort(arr[pivot+1:])
}

func MultiThreadedQuickSort(arr []int) {

	if len(arr) <= LenghtThreshold {
		InsertionSort(arr)
		return
	}

	var wg sync.WaitGroup

	wg.Add(1)
	go _SyncMultiThreadedQuickSort(arr, &wg)

	wg.Wait()
}

func _SyncMultiThreadedQuickSort(arr []int, wg *sync.WaitGroup) {

	defer wg.Done()

	if len(arr) <= LenghtThreshold {
		InsertionSort(arr)
		return
	}

	pivot := _Partition(arr)

	wg.Add(2)
	go _SyncMultiThreadedQuickSort(arr[:pivot], wg)
	go _SyncMultiThreadedQuickSort(arr[pivot+1:], wg)
}

func _Partition(arr []int) int {

	pivot := arr[0]
	i := 1

	for j := 1; j < len(arr); j++ {
		if arr[j] <= pivot {
			arr[i], arr[j] = arr[j], arr[i]
			i++
		}
	}

	arr[0], arr[i-1] = arr[i-1], arr[0]
	return i - 1
}

func BenchMark(fn func([]int), arr []int) time.Duration {
	start := time.Now()

	fn(arr)

	return time.Since(start)
}

func main() {

	if len(os.Args) < 2 {
		fmt.Println(
			"you must inform a number")
		return
	}

	size, err := strconv.Atoi(os.Args[1])
	if err != nil {
		fmt.Println(err)
		return
	}

	if size <= 0 {
		fmt.Println(
			"the informed number must be >0")
		return
	}

	var sarr, marr []int

	{
		arr := make([]int, size)

		for i := range arr {
			arr[i] = i + 1
		}

		for i := range len(arr) {
			s := rand.Intn(size)
			arr[i], arr[s] = arr[s], arr[i]
		}

		sarr = make([]int, len(arr))
		copy(sarr, arr)
		marr = arr
	}

	mtt := BenchMark(MultiThreadedQuickSort, marr)
	stt := BenchMark(SingleThreadedQuickSort, sarr)

	if !_VerifySortion(sarr) {
		fmt.Println(
			"the singletheaded array wasn't sorted correctly")
		return
	}

	if !_VerifySortion(marr) {
		fmt.Println(
			"the multitheaded array wasn't sorted correctly")
		return
	}

	fmt.Printf(
		"Singlethreaded: %dμs\n",
		stt.Microseconds())

	fmt.Printf(
		"Multithreaded: %dμs\n",
		mtt.Microseconds())
}

func _VerifySortion[T cmp.Ordered](arr []T) bool {

	for i := 1; i < len(arr); i++ {
		if arr[i-1] > arr[i] {
			return false
		}
	}

	return true
}

func InsertionSort(arr []int) {
	for i := 1; i < len(arr); i++ {

		for tmp, j := arr[i], i; ; j-- {

			if j <= 0 || arr[j-1] <= tmp {
				arr[j] = tmp
				break
			}

			arr[j] = arr[j-1]
		}
	}
}