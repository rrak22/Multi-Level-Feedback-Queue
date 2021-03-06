const Queue = require('./Queue'); 
const { 
    QueueType,
    PRIORITY_LEVELS,
} = require('./constants/index');

// A class representing the scheduler
// It holds a single blocking queue for blocking processes and three running queues 
// for non-blocking processes
class Scheduler { 
    constructor() { 
        this.clock = Date.now();
        this.globalQuantum = 500;
        this.blockingQueue = new Queue(this, 50, 0, QueueType.BLOCKING_QUEUE);
        this.runningQueues = [];
        // Initialize all the CPU running queues
        for (let i = 0; i < PRIORITY_LEVELS; i++) {
            this.runningQueues[i] = new Queue(this, 10 + i * 20, i, QueueType.CPU_QUEUE);
        }
    }

    // Executes the scheduler in an infinite loop as long as there are processes in any of the queues
    // Calculate the time slice for the next iteration of the scheduler by subtracting the current
    // time from the clock property. Don't forget to update the clock property afterwards.
    // On every iteration of the scheduler, if the blocking queue is not empty, blocking work
    // should be done. Once the blocking work has been done, perform some CPU work in the same iteration.


    run() {
      while (!this.allQueuesEmpty()) {

        const timeSlice = Date.now() - this.clock;

        if (!this.blockingQueue.isEmpty()) {
          this.blockingQueue.doBlockingWork(timeSlice);
        }         
        
        for (let i = 0; i < this.runningQueues.length; i++) {
          if (!this.runningQueues[i].isEmpty()) {
            this.runningQueues[i].doCPUWork(timeSlice);
            break;
          }
        }
        this.clock = Date.now();
        this.globalQuantum -= timeSlice;

        if (this.globalQuantum === 0) {
          for (let i = 1; i < this.runningQueues.length; i++) {
            let currentQueue = this.runningQueues[i];
            
            if (!currentQueue.isEmpty()) {
              currentQueue.processes.forEach(process => {
                let currentProcess = currentQueue.dequeue();
                this.runningQueues[0].enqueue(currentProcess);
              });
            }
          }
          this.globalQuantum = 500;
        }
      }
    }

    allQueuesEmpty() {
      for (let i = 0; i < this.runningQueues.length; i++) {
        if (!this.runningQueues[i].isEmpty()) return false;
      }
      if (!this.blockingQueue.isEmpty()) return false;
      
      return true;
    }


    addNewProcess(process) {
        this.runningQueues[0].enqueue(process);
    }

    // The scheduler's interrupt handler that receives a queue, a process, and an interrupt string constant
    // Should handle PROCESS_BLOCKED, PROCESS_READY, and LOWER_PRIORITY interrupts.
    handleInterrupt(queue, process, interrupt) {
      switch (interrupt) {
        case 'PROCESS_BLOCKED':
          this.blockingQueue.enqueue(process);
          break;
        case 'PROCESS_READY':
          this.addNewProcess(process);
          break;
        case 'LOWER_PRIORITY':
          const priority = queue.getPriorityLevel();
          if (queue.getQueueType() === QueueType.BLOCKING_QUEUE) {
            queue.enqueue(process);
            break;
          }
          if (priority === PRIORITY_LEVELS - 1) {
            queue.enqueue(process);
            break;
          }
          this.runningQueues[priority + 1].enqueue(process);
          break;
      }
    }
       

    // Private function used for testing; DO NOT MODIFY
    _getCPUQueue(priorityLevel) {
        return this.runningQueues[priorityLevel];
    }

    // Private function used for testing; DO NOT MODIFY
    _getBlockingQueue() {
        return this.blockingQueue;
    }
}

module.exports = Scheduler;
