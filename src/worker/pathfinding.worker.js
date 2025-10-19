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

function findKShortestPaths(graph, startId, endId, k, option) {
  const { exceptions, agentLevel, jogressOption, startNodeData, endNodeData } =
    option;
  const endGeneration = endNodeData.generation;

  const HEURUSTIC_WEIGHT = 0;

  const pq = new PriorityQueue();
  const distances = new Map();
  const cameFrom = new Map();

  distances.set(startId, 0);

  const h_start = Math.abs(startNodeData.generation - endGeneration);

  const f_start = 0 + h_start * HEURUSTIC_WEIGHT;

  pq.push([f_start, 0, startId]);

  let found = false;

  while (pq.isNotEmpty()) {
    const [f_cost_ignored, g_cost, currentNode] = pq.pop();

    if (g_cost > (distances.get(currentNode) ?? Infinity)) {
      continue;
    }

    if (currentNode === endId) {
      found = true;
      break;
    }

    const currentNodeData = digimonDataMap.get(currentNode);
    if (!currentNodeData) continue;

    const neighbors = graph.get(currentNode) || [];

    for (const neighbor of neighbors) {
      if (exceptions.has(neighbor)) continue;

      const neighborData = digimonDataMap.get(neighbor);
      if (!neighborData) continue;

      const isEvolution = neighborData.generation >= currentNodeData.generation;
      if (isEvolution) {
        const isJogress = jogressIdSet.has(neighborData.id);
        if (isJogress && jogressOption === 'not-include') continue;

        let requiredLevel = 1;
        if (exceptionLevelRules.hasOwnProperty(neighborData.id)) {
          requiredLevel = exceptionLevelRules[neighborData.id];
        } else if (agentLevelRules.hasOwnProperty(neighborData.generation)) {
          requiredLevel = agentLevelRules[neighborData.generation];
        }
        if (agentLevel < requiredLevel) continue;
      }

      const new_g_cost = g_cost + 1;

      // if (new_g_cost > 3) continue;

      if (new_g_cost < (distances.get(neighbor) ?? Infinity)) {
        distances.set(neighbor, new_g_cost);
        cameFrom.set(neighbor, currentNode);

        const h_neighbor = Math.abs(neighborData.generation - endGeneration);

        const new_f_cost = new_g_cost + h_neighbor * HEURUSTIC_WEIGHT;

        pq.push([new_f_cost, new_g_cost, neighbor]);
      }
    }
  }

  if (!found) {
    return [];
  }

  const path = [];
  let current = endId;
  while (current !== undefined) {
    path.push(current);
    current = cameFrom.get(current);
  }

  return [{ cost: distances.get(endId), path: path.reverse() }];

  // const { exceptions, agentLevel, jogressOption } = option;

  // const pq = new PriorityQueue();
  // const distances = new Map();
  // const cameFrom = new Map();

  // distances.set(startId, 0);
  // pq.push([0, startId]);

  // let found = false;

  // while (pq.isNotEmpty()) {
  //   const [cost, currentNode] = pq.pop();

  //   if (cost > distances.get(currentNode)) {
  //     continue;
  //   }

  //   if (currentNode === endId) {
  //     found = true;
  //     break;
  //   }

  //   const currentNodeData = digimonDataMap.get(currentNode);
  //   if (!currentNodeData) continue;

  //   const neighbors = graph.get(currentNode) || [];
  //   for (const neighbor of neighbors) {
  //     // 제외 목록에 포함된 노드인지 확인
  //     if (exceptions.has(neighbor)) continue;

  //     const neighborData = digimonDataMap.get(neighbor);
  //     if (!neighborData) continue;

  //     // 조그레스 필터
  //     const isJogress = jogressIdSet.has(neighborData.id);
  //     if (isJogress && jogressOption === 'not-include') continue;

  //     // 에이전트 레벨 필터
  //     const isEvolution = neighborData.generation >= currentNodeData.generation;
  //     if (isEvolution) {
  //       let requiredLevel = 1;

  //       if (exceptionLevelRules.hasOwnProperty(neighborData.id)) {
  //         requiredLevel = exceptionLevelRules[neighborData.id];
  //       } else if (agentLevelRules.hasOwnProperty(neighborData.generation)) {
  //         requiredLevel = agentLevelRules[neighborData.generation];
  //       }

  //       if (agentLevel < requiredLevel) continue;
  //     }

  //     const newCost = cost + 1;

  //     if (newCost < (distances.get(neighbor) || Infinity)) {
  //       distances.set(neighbor, newCost);
  //       cameFrom.set(neighbor, currentNode);
  //       pq.push([newCost, neighbor]);
  //     }
  //   }
  // }

  // if (!found) {
  //   return [];
  // }

  // const path = [];
  // let current = endId;

  // while (current !== undefined) {
  //   path.push(current);
  //   current = cameFrom.get(current);
  // }

  // return [{ cost: distances.get(endId), path: path.reverse() }];
}

let graph = null;
let digimonDataMap = null;
let jogressIdSet = null;
let agentLevelRules = null;
let exceptionLevelRules = null;

self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      try {
        const { digimonList, jogressList, agentLevelData } = payload;

        digimonDataMap = new Map(digimonList.map((d) => [d.id, d]));
        graph = buildGraph(digimonList);

        jogressIdSet = new Set(jogressList.map((j) => j.id));

        agentLevelRules = agentLevelData.agentLevel;
        exceptionLevelRules = agentLevelData.exceptionLevel;

        self.postMessage({ type: 'INIT_COMPLETE' });
      } catch (err) {
        self.postMessage({ type: 'ERROR', payload: err.message });
      }
      break;

    case 'FIND_PATHS':
      if (
        !graph ||
        !digimonDataMap ||
        !jogressIdSet ||
        !agentLevelRules ||
        !exceptionLevelRules
      ) {
        self.postMessage({ type: 'ERROR', payload: 'Graph not initialized.' });
        return;
      }

      const { startId, endId, k, exceptions, agentLevel, jogressOption } =
        payload;
      const exceptionSet = new Set(exceptions);

      if (exceptionSet.has(startId) || exceptionSet.has(endId)) {
        self.postMessage({ type: 'PATHS_FOUND', payload: [] });
        return;
      }

      // 끝 노드 검사
      const endNodeData = digimonDataMap.get(endId);
      if (!endNodeData) {
        self.postMessage({
          type: 'ERROR',
          payload: `End ID ${endId} not found.`,
        });
        return;
      }

      // if (jogressIdSet.has(endId) && jogressOption === 'not-include') {
      //   self.postMessage({ type: 'PATHS_FOUND', payload: [] });
      //   return;
      // }

      let requiredLevel = 1;
      const generation = endNodeData.generation;

      if (exceptionLevelRules.hasOwnProperty(endId)) {
        requiredLevel = exceptionLevelRules[endId];
      } else if (agentLevelRules.hasOwnProperty(generation)) {
        requiredLevel = agentLevelRules[generation];
      }

      if (agentLevel < requiredLevel) {
        self.postMessage({ type: 'PATHS_FOUND', payload: [] });
        return;
      }

      // 시작 노드 검사
      const startNodeData = digimonDataMap.get(startId);
      if (!startNodeData) {
        self.postMessage({
          type: 'ERROR',
          payload: `Start ID ${startId} not found.`,
        });
        return;
      }

      // 조그레스 옵션 검사
      // if (jogressIdSet.has(startId) && jogressOption === 'not-include') {
      //   console.log(
      //     'Pre-check failed: Start node is excluded by Jogress option.',
      //   );
      //   self.postMessage({ type: 'PATHS_FOUND', payload: [] });
      //   return;
      // }

      // 에이전트 레벨 검사
      let startRequiredLevel = 1;
      const startGeneration = startNodeData.generation;

      if (exceptionLevelRules.hasOwnProperty(startId)) {
        startRequiredLevel = exceptionLevelRules[startId];
      } else if (agentLevelRules.hasOwnProperty(startGeneration)) {
        startRequiredLevel = agentLevelRules[startGeneration];
      }

      if (agentLevel < startRequiredLevel) {
        console.log(
          `Pre-check failed: Agent level ${agentLevel} is too low for start generation ${startGeneration} (requires ${startRequiredLevel}).`,
        );
        self.postMessage({ type: 'PATHS_FOUND', payload: [] });
        return;
      }

      const option = {
        exceptions: exceptionSet,
        agentLevel,
        jogressOption,
        startNodeData,
        endNodeData,
      };
      const paths = findKShortestPaths(graph, startId, endId, k, option);

      const pathsWithData = paths.map((result) => ({
        ...result,
        path: result.path.map((id) => {
          const digi = digimonDataMap.get(id);
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
