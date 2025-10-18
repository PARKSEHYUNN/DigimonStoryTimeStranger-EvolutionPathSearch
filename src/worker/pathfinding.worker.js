// src/worker/pathfinding.worker.js

class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  getParentIndex(i) {
    return Math.floor((i - 1) / 2);
  }
  getLeftChildIndex(i) {
    return 2 * i + 1;
  }
  getRightChildIndex(i) {
    return 2 * i + 2;
  }
  hasParent(i) {
    return this.getParentIndex(i) >= 0;
  }
  hasLeftChild(i) {
    return this.getLeftChildIndex(i) < this.heap.length;
  }
  hasRightChild(i) {
    return this.getRightChildIndex(i) < this.heap.length;
  }
  swap(i1, i2) {
    [this.heap[i1], this.heap[i2]] = [this.heap[i2], this.heap[i1]];
  }

  isNotEmpty() {
    return this.heap.length > 0;
  }
  push(element) {
    this.heap.push(element);
    this.heapifyUp();
  }
  heapifyUp() {
    let index = this.heap.length - 1;
    while (
      this.hasParent(index) &&
      this.heap[index][0] < this.heap[this.getParentIndex(index)][0]
    ) {
      const parentIndex = this.getParentIndex(index);
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }
  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const element = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown();
    return element;
  }
  heapifyDown() {
    let index = 0;
    while (this.hasLeftChild(index)) {
      let smallerChildIndex = this.getLeftChildIndex(index);
      if (
        this.hasRightChild(index) &&
        this.heap[this.getRightChildIndex(index)][0] <
          this.heap[smallerChildIndex][0]
      ) {
        smallerChildIndex = this.getRightChildIndex(index);
      }

      if (this.heap[index][0] < this.heap[smallerChildIndex][0]) {
        break;
      } else {
        this.swap(index, smallerChildIndex);
      }
      index = smallerChildIndex;
    }
  }
}

function buildGraph(digimonList) {
  const graph = new Map();

  for (const digimon of digimonList) {
    const id = digimon.id;

    if (!graph.has(id)) {
      graph.set(id, new Set());
    }
    const neighbors = graph.get(id);

    for (const fromId of digimon.evolution.from) {
      neighbors.add(fromId);
      if (!graph.has(fromId)) {
        graph.set(fromId, new Set());
      }
      graph.get(fromId).add(id);
    }

    for (const toId of digimon.evolution.to) {
      neighbors.add(toId);
      if (!graph.has(toId)) {
        graph.set(toId, new Set());
      }
      graph.get(toId).add(id);
    }
  }

  const finalGraph = new Map();
  for (const [id, neighborSet] of graph.entries()) {
    finalGraph.set(id, Array.from(neighborSet));
  }

  return finalGraph;
}

function findKShortestPaths(graph, startId, endId, k) {
  const results = [];
  const pq = new PriorityQueue();

  pq.push([0, startId, [startId]]);

  while (pq.isNotEmpty() && results.length < k) {
    const [cost, currentNode, path] = pq.pop();
    if (currentNode === endId) {
      results.push({ cost, path });
      continue;
    }

    const neighbors = graph.get(currentNode) || [];
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        const newCost = cost + 1;
        const newPath = [...path, neighbor];
        pq.push([newCost, neighbor, newPath]);
      }
    }
  }

  return results;
}

let graph = null;
let digimonData = null;

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      try {
        digimonData = payload;
        graph = buildGraph(payload);

        self.postMessage({ type: 'INIT_COMPLETE' });
      } catch (err) {
        self.postMessage({ type: 'ERROR', payload: err.message });
      }
      break;

    case 'FIND_PATHS':
      if (!graph) {
        self.postMessage({ type: 'ERROR', payload: 'Graph not initialized.' });
        return;
      }

      const { startId, endId, k } = payload;
      const paths = findKShortestPaths(graph, startId, endId, k);

      const pathsWithData = paths.map((result) => ({
        ...result,
        path: result.path.map((id) => {
          const digi = digimonData.find((d) => d.id === id);
          if (digi) {
            return digi;
          }

          return { id: id, name: [`ID ${id}`, `ID ${id}`, `ID ${id}`] };
        }),
      }));

      self.postMessage({ type: 'PATHS_FOUND', payload: pathsWithData });
      break;
  }
};
