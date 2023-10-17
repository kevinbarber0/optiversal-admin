export default class ProcessExecuteService {
  /*
    Properties
   */
  _maximumProcessCount = 0; // Maximum number of concurrent processes

  _processQueue = []; // Array to keep process IDs to run
  _runningProcessCount = 0; // Number of processes that are currently running

  _processTree = {}; // Process tree
  _nextProcessId = 0; // Sequence ID to be assigned to processes

  /**
   * Constructor
   * @param {Array} processList Array of processes to execute
   * @param {Number} maxProcessCount Maximum number of concurrent processes
   */
  constructor(processList, maxProcessCount = Number.MAX_SAFE_INTEGER) {
    this._maximumProcessCount = maxProcessCount;

    this._processTree = {
      0: {
        id: 0,
        isFinished: false,
        masterId: null,
        parentProcessId: null,
      },
    };
    this._nextProcessId = 1;
    this._constructTree(0, processList, false);
  }

  /**
   * Construct tree from list of processes
   * @param {Number} parentProcessId ID of process group
   * @param {Number} processes Array of processes
   * @param {Boolean} isParallel True to run processes in parallel, False in series
   */
  _constructTree(parentProcessId, processes, isParallel) {
    processes.reduce((prevMaster, p) => {
      const newProcessId = this._nextProcessId++;

      this._processTree = {
        ...this._processTree,
        [newProcessId]: {
          id: newProcessId,
          parentProcessId: parentProcessId,
          masterId: prevMaster,
          isFinished: false,
        },
      };

      if (Array.isArray(p)) {
        this._constructTree(newProcessId, p, !isParallel);
      } else {
        this._processTree[newProcessId].process = p;
      }

      // If it's parallel process, set null as master, otherwise set prev process as its master
      return isParallel ? null : newProcessId;
    }, null);
  }

  /**
   * Add processes to queue, which are dependent on the given process
   * @param {Number} processId Process ID
   */
  _triggerSlaveProcess(processId) {
    this._processQueue.unshift(
      ...Object.values(this._processTree)
        .filter(({ masterId }) => masterId === processId)
        .map(({ id }) => id),
    );
  }

  /**
   * Add processes to queue, which are children of the given process
   * @param {Number} processId Process ID
   */
  _triggerChildProcess(processId) {
    this._processQueue.unshift(
      ...Object.values(this._processTree)
        .filter(
          ({ parentProcessId, masterId }) =>
            parentProcessId === processId && masterId === null,
        )
        .map(({ id }) => id),
    );
  }

  /**
   * Check if parent process is finished by looking at all sibling processes
   * @param {Number} parentProcessId Parent Process Id
   */
  _checkParentProcess(parentProcessId) {
    // Check if it's parent is finished
    const siblings = Object.values(this._processTree).filter(
      (p) => p.parentProcessId === parentProcessId,
    );

    // If all sibling processes are finished, mark parent process as done
    if (siblings.every(({ isFinished }) => isFinished === true)) {
      this._handleProcessFinish(parentProcessId);
    }
  }

  /**
   * Post process handler
   * @param {Number} processId Finished Process Id
   */
  _handleProcessFinish(processId) {
    // Mark this process as done
    this._processTree[processId].isFinished = true;

    // Trigger process that are dependent on this process
    this._triggerSlaveProcess(processId);

    // Check if all processes with same parentProcessId are finished
    if (this._processTree[processId].parentProcessId) {
      this._checkParentProcess(this._processTree[processId].parentProcessId);
    }
  }

  /**
   * Take the processes from process queue
   */
  _runProcessFromQueue() {
    if (this._runningProcessCount >= this._maximumProcessCount) return;

    if (this._processQueue.length == 0) return;

    while (
      this._runningProcessCount < this._maximumProcessCount &&
      this._processQueue.length > 0
    ) {
      const newProcess = this._processTree[this._processQueue.shift()];

      if (newProcess.process) {
        this._runningProcessCount++;

        newProcess.process().finally(() => {
          this._runningProcessCount--;
          this._handleProcessFinish(newProcess.id);
          this._runProcessFromQueue();
        });
      } else {
        // If it has children process, put them in the queue
        this._triggerChildProcess(newProcess.id);
      }
    }
  }

  /**
   * Run all processes
   */
  run() {
    this._runningProcessCount = 0;
    this._processQueue = [0];
    this._runProcessFromQueue();
  }
}
