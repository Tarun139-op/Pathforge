import TinyQueue from "tinyqueue";

function djikstra(adj, startId, endId, nodesMap) {
  if (!adj || !adj[startId] || !adj[endId])
    return { edges: [], path: [], distance: Infinity };

  const dist = {};
  const prev = {};
  const visitedEdges = [];

  const pq = new TinyQueue([], (a, b) => a.priority - b.priority);

  Object.keys(adj).forEach((node) => {
    dist[node] = Infinity;
    prev[node] = null;
  });

  dist[startId] = 0;
  pq.push({ node: startId, priority: 0 });

  while (pq.length > 0) {
    const popped = pq.pop();
    if (!popped) break;
    const current = popped.node;
    const currDist = popped.priority;

    if (currDist > dist[current]) continue;
    if (current === endId) break;

    const neighbors = adj[current] || [];
    for (const nb of neighbors) {
      const next = String(nb.node);
      const weight = nb.weight;
      const alt = dist[current] + weight;

      if (alt < dist[next]) {
        dist[next] = alt;
        prev[next] = current;
        pq.push({ node: next, priority: alt });

        // Record edge for visualization
        const c1 = nodesMap[current];
        const c2 = nodesMap[next];
        if (c1 && c2) {
          visitedEdges.push({
            id: current + "-" + next,
            coords: [c1, c2],
          });
        }
      }
    }
  }

  // Reconstruct path
  const path = [];
  let u = endId;
  if (prev[u] !== null || u === startId) {
    while (u) {
      path.unshift({
        id: u,
        coords: nodesMap[u],
      });
      if (u === startId) break;
      u = prev[u];
    }
  }

  return {
    edges: visitedEdges,
    path,
  };
}

//A star function
//#region Astar
/**
 * A* with pure Euclidean edge cost + heuristic.
 * Supports nodesMap coords as [x,y], {x,y}, {lng,lat}, or {longitude,latitude}.
 */
function astar(adj, startId, endId, nodesMap) {
  // normalize ids to strings (keys in adj are strings)
  const S = String(startId);
  const T = String(endId);

  // ---- helpers ----
  const getCoord = (id) => {
    const n = nodesMap[id];
    if (!n) return null;
    if (Array.isArray(n)) {
      const [x, y] = n;
      return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
    }
    // objects
    const x = n.x ?? n.lng ?? n.longitude ?? n.lon;
    const y = n.y ?? n.lat ?? n.latitude;
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
    // return null if nothing matches
  };

  const euclid = (idA, idB) => {
    const a = getCoord(idA);
    const b = getCoord(idB);
    if (!a || !b) return Infinity;
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  };

  // ---- guards ----
  if (!adj || !adj[S] || !adj[T]) {
    return { edges: [], path: [], distance: Infinity };
  }

  const gScore = {};
  const fScore = {};
  const prev = {};
  const visitedEdges = [];

  const pq = new TinyQueue([], (a, b) => a.priority - b.priority);

  // init
  Object.keys(adj).forEach((node) => {
    const id = String(node);
    gScore[id] = Infinity;
    fScore[id] = Infinity;
    prev[id] = null;
  });

  gScore[S] = 0;
  fScore[S] = euclid(S, T);
  pq.push({ node: S, priority: fScore[S] });

  // ---- main loop ----
  while (pq.length > 0) {
    const popped = pq.pop();
    if (!popped) break;
    const current = popped.node;
    const currF = popped.priority;

    // outdated queue entry
    if (currF > fScore[current]) continue;

    if (current === T) break;

    const neighbors = adj[current] || [];
    for (const nb of neighbors) {
      const next = String(nb.node); // weight ignored on purpose

      // old
      const c = getCoord(current);
      const n = getCoord(next);
      if (!c || !n) continue;

      const edgeCost = Math.hypot(n[0] - c[0], n[1] - c[1]);

      if (!Number.isFinite(edgeCost)) continue;

      const tentativeG = gScore[current] + edgeCost;

      if (tentativeG < gScore[next]) {
        prev[next] = current;
        gScore[next] = tentativeG;
        fScore[next] = tentativeG + euclid(next, T);
        pq.push({ node: next, priority: fScore[next] });

        // for visualization (use original nodesMap coords as-is)
        const c1 = nodesMap[current];
        const c2 = nodesMap[next];
        if (c1 && c2) {
          visitedEdges.push({ id: current + "-" + next, coords: [c1, c2] });
        }
      }
    }
  }

  // ---- reconstruct path ----
  const path = [];
  let u = T;
  if (prev[u] !== null || u === S) {
    while (u) {
      path.unshift({ id: u, coords: nodesMap[u] });
      if (u === S) break;
      u = prev[u];
    }
  }

  return { edges: visitedEdges, path };
}

//#endregion
//#region greedy first
/**
 * Greedy Best-First Search with pure Euclidean heuristic.
 * Supports nodesMap coords as [x,y], {x,y}, {lng,lat}, or {longitude,latitude}.
 * Does NOT guarantee shortest path, only fast goal-directed search.
 */
function greedy(adj, startId, endId, nodesMap) {
  // normalize ids
  const S = String(startId);
  const T = String(endId);

  // ---- helpers ----
  const getCoord = (id) => {
    const n = nodesMap[id];
    if (!n) return null;
    if (Array.isArray(n)) {
      const [x, y] = n;
      return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
    }
    const x = n.x ?? n.lng ?? n.longitude ?? n.lon;
    const y = n.y ?? n.lat ?? n.latitude;
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
  };

  const euclid = (idA, idB) => {
    const a = getCoord(idA);
    const b = getCoord(idB);
    if (!a || !b) return Infinity;
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  };

  // ---- guards ----
  if (!adj || !adj[S] || !adj[T]) {
    return { edges: [], path: [], distance: Infinity };
  }

  const prev = {};
  const visitedEdges = [];
  const visited = new Set();

  const pq = new TinyQueue([], (a, b) => a.priority - b.priority);

  // init
  Object.keys(adj).forEach((node) => {
    prev[node] = null;
  });

  pq.push({ node: S, priority: euclid(S, T) });

  // ---- main loop ----
  while (pq.length > 0) {
    const popped = pq.pop();
    if (!popped) break;
    const current = popped.node;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === T) break;

    const neighbors = adj[current] || [];
    for (const nb of neighbors) {
      const next = String(nb.node);
      if (visited.has(next)) continue;

      // Record parent
      if (prev[next] === null) prev[next] = current;

      // Priority ONLY based on heuristic
      pq.push({ node: next, priority: euclid(next, T) });

      // For visualization
      const c1 = nodesMap[current];
      const c2 = nodesMap[next];
      if (c1 && c2) {
        visitedEdges.push({ id: current + "-" + next, coords: [c1, c2] });
      }
    }
  }

  // ---- reconstruct path ----
  const path = [];
  let u = T;
  if (prev[u] !== null || u === S) {
    while (u) {
      path.unshift({ id: u, coords: nodesMap[u] });
      if (u === S) break;
      u = prev[u];
    }
  }

  // NOTE: distance is not reliable in greedy (no gScore)
  return { edges: visitedEdges, path };
}

//#endregion

//#region bidirectional algo
function bidirectional(adj, startId, endId, nodesMap) {
  const S = String(startId);
  const T = String(endId);
  if (!adj || !adj[S] || !adj[T]) {
    return { edges: [], path: [], distance: Infinity };
  }

  const distF = {},
    distB = {};
  const prevF = {},
    prevB = {};
  const seenF = new Set(),
    seenB = new Set();
  const pqF = new TinyQueue([], (a, b) => a.priority - b.priority);
  const pqB = new TinyQueue([], (a, b) => a.priority - b.priority);
  const visitedEdges = [];

  // Initialize distances and prev pointers
  Object.keys(adj).forEach((node) => {
    distF[node] = Infinity;
    distB[node] = Infinity;
    prevF[node] = null;
    prevB[node] = null;
  });

  distF[S] = 0;
  distB[T] = 0;
  pqF.push({ node: S, priority: 0 });
  pqB.push({ node: T, priority: 0 });

  let meetingNode = null;
  let bestDistance = Infinity;

  while (pqF.length && pqB.length) {
    // Expand one step from forward frontier
    const { node: currF } = pqF.pop();
    if (currF === undefined) break;
    if (distF[currF] > bestDistance) break;
    seenF.add(currF);

    if (seenB.has(currF)) {
      meetingNode = currF;
      bestDistance = distF[currF] + distB[currF];
      break;
    }

    for (const nb of adj[currF] || []) {
      const nxt = String(nb.node);
      const alt = distF[currF] + nb.weight;
      if (alt < distF[nxt]) {
        distF[nxt] = alt;
        prevF[nxt] = currF;
        pqF.push({ node: nxt, priority: alt });
        // record edge
        const c1 = nodesMap[currF],
          c2 = nodesMap[nxt];
        if (c1 && c2)
          visitedEdges.push({ id: currF + "-" + nxt, coords: [c1, c2] });
      }
    }

    // Expand one step from backward frontier
    const { node: currB } = pqB.pop();
    if (currB === undefined) break;
    if (distB[currB] > bestDistance) break;
    seenB.add(currB);

    if (seenF.has(currB)) {
      meetingNode = currB;
      bestDistance = distF[currB] + distB[currB];
      break;
    }

    for (const nb of adj[currB] || []) {
      const nxt = String(nb.node);
      const alt = distB[currB] + nb.weight;
      if (alt < distB[nxt]) {
        distB[nxt] = alt;
        prevB[nxt] = currB;
        pqB.push({ node: nxt, priority: alt });
        const c1 = nodesMap[currB],
          c2 = nodesMap[nxt];
        if (c1 && c2)
          visitedEdges.push({ id: currB + "-" + nxt, coords: [c1, c2] });
      }
    }
  }

  // No connection found
  if (meetingNode === null) {
    return { edges: visitedEdges, path: [], distance: Infinity };
  }

  // Reconstruct path from start to meetingNode
  const pathF = [];
  let u = meetingNode;
  while (u !== null) {
    pathF.unshift({ id: u, coords: nodesMap[u] });
    u = prevF[u];
    if (u === S) {
      pathF.unshift({ id: S, coords: nodesMap[S] });
      break;
    }
  }

  // Reconstruct path from meetingNode to end (reverse backward pointers)
  const pathB = [];
  u = meetingNode;
  while (u !== null) {
    pathB.push({ id: u, coords: nodesMap[u] });
    u = prevB[u];
    if (u === T) {
      pathB.push({ id: T, coords: nodesMap[T] });
      break;
    }
  }

  // Combine, removing duplicate meetingNode
  const fullPath = pathF.concat(pathB.slice(1));

  return {
    edges: visitedEdges,
    path: fullPath,
  };
}

//#endregion
self.onmessage = function (e) {
  const { type, algo, adj, startId, endId, nodesMap } = e.data;
  try {
    if (type === "RUN_ALGO") {
      let result = {};
      if (algo === "djikstra") {
        console.log("Djikstra called");
        result = djikstra(adj, startId, endId, nodesMap);
      } else if (algo === "astar") {
        console.log("astar called");
        result = astar(adj, startId, endId, nodesMap);
      } else if (algo === "greedy") {
        console.log("greedy called");
        result = greedy(adj, startId, endId, nodesMap);
      } else if (algo === "bidirectional") {
        console.log("bidirectional called");
        result = bidirectional(adj, startId, endId, nodesMap);
      }

      self.postMessage({ status: "success", type: "RESULT", result });
    }
  } catch (error) {
    self.postMessage({ status: "error", error: error.message });
  }
};
