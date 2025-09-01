import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

function PathAnimator({
  map,
  visited = [],
  path = [],
  startNode,
  endNode,
  play,
  sideStatus,
  setError,
}) {
  const raf = useRef(null);
  const mapReady = useRef(false);

  // Animation state
  const visitedLine = useRef([]);
  const pathLine = useRef([]);
  const vIdx = useRef(0);
  const pIdx = useRef(0);

  // Animation phase tracking
  const currentPhase = useRef("idle"); // "idle" | "visited" | "path" | "complete"
  const lastTimestamp = useRef(0);
  //animation chart with speed and batchsize for maximum efficiency
  const anim = [
    [160, 2], // 🐢 Very slow: 300ms delay, 1 segment at a time
    [150, 2], // Slow: smoother but still slow
    [120, 4], // Moderate slow: visible but faster
    [100, 5], // Medium-slow: good clarity
    [80, 10], // Balanced: smooth visuals
    [60, 10], // Medium: noticeable speed boost
    [50, 15], // Medium-fast: still smooth
    [30, 20], // Fast: good performance
    [10, 30], // Very fast: quick updates
    [0, 40], // ⚡ Max speed: rapid updates, best efficiency
  ];

  // Helper: cancel RAF safely
  const cancelRAF = () => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  };

  // Ensure sources/layers exist
  useEffect(() => {
    if (!map) return;

    const ensure = () => {
      mapReady.current = true;

      if (!map.getSource("Visited")) {
        map.addSource("Visited", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [] },
          },
        });
        map.addLayer({
          id: "Visited",
          type: "line",
          source: "Visited",
          paint: { "line-width": 2, "line-color": "#3b82f6" },
        });
      }

      if (!map.getSource("Path")) {
        map.addSource("Path", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [] },
          },
        });
        map.addLayer({
          id: "Path",
          type: "line",
          source: "Path",
          paint: { "line-width": 4, "line-color": "#22c55e" },
        });
      }
    };

    if (map.isStyleLoaded()) ensure();
    else {
      const onLoad = () => ensure();
      map.once("load", onLoad);
      return () => map.off("load", onLoad);
    }
  }, [map]);

  // Reset animation when new data arrives
  useEffect(() => {
    if (!map || !mapReady.current) return;

    // Stop any running animation
    cancelRAF();

    // Reset all state
    visitedLine.current = [];
    pathLine.current = [];
    vIdx.current = 0;
    pIdx.current = 0;
    currentPhase.current = "idle";
    lastTimestamp.current = 0;

    // Clear layers
    const vSrc = map.getSource("Visited");
    if (vSrc) {
      vSrc.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
      });
    }

    const pSrc = map.getSource("Path");
    if (pSrc) {
      pSrc.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
      });
    }

    // Start animation if play is true and we have data
    if (play && (visited.length || path.length)) {
      if (visited.length) {
        currentPhase.current = "visited";
        startAnimation();
      } else if (path.length) {
        currentPhase.current = "path";
        // Initialize path line with first coordinate
        if (path[0]?.coords && Array.isArray(path[0].coords)) {
          pathLine.current = [path[0].coords];
        }
        startAnimation();
      }
    }
  }, [visited, path, startNode, endNode]);

  // Handle play/pause changes
  useEffect(() => {
    if (!map || !mapReady.current) return;

    if (play) {
      // Resume animation if we have data and aren't complete
      if (
        currentPhase.current !== "idle" &&
        currentPhase.current !== "complete"
      ) {
        startAnimation();
      } else if (visited.length || path.length) {
        // Start fresh if we were idle
        if (visited.length && vIdx.current < visited.length) {
          currentPhase.current = "visited";
          startAnimation();
        } else if (path.length && pIdx.current < path.length) {
          currentPhase.current = "path";
          if (pathLine.current.length === 0 && path[0]?.coords) {
            pathLine.current = [path[0].coords];
          }
          startAnimation();
        }
      }
    } else {
      // Pause animation
      cancelRAF();
    }
  }, [play]);

  //Radius Layer Removal
  function removeLayerIfExists(map, layerId, sourceId) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  }
  //Radius layer readding again
  function addStartCircle(map) {
    map.addLayer({
      id: "start-circle-layer",
      type: "fill",
      source: "start-circle",
      paint: {
        "fill-color": sideStatus.radius_color,
        "fill-opacity": 0.12,
        "fill-outline-color": "green",
      },
    });
  }
  // Main animation loop
  const startAnimation = () => {
    removeLayerIfExists(map, "start-circle-layer", "start-circle");
    if (raf.current) return; // Already running

    const animate = (timestamp) => {
      if (!play) return; // Stop if paused

      const speedMs =
        currentPhase.current === "visited" ? anim[sideStatus.speed][0] : 10;

      if (timestamp - lastTimestamp.current >= speedMs) {
        let shouldContinue = false;

        if (currentPhase.current === "visited") {
          shouldContinue = animateVisited();
        } else if (currentPhase.current === "path") {
          shouldContinue = animatePath();
        }

        if (!shouldContinue) {
          // Phase complete, move to next or finish
          if (currentPhase.current === "visited" && path.length > 0) {
            currentPhase.current = "path";
            // Initialize path line
            if (path[0]?.coords && Array.isArray(path[0].coords)) {
              pathLine.current = [path[0].coords];
            }
            shouldContinue = true;
          } else {
            currentPhase.current = "complete";
            if (path.length === 0) {
              setError("No possible path to selected node in current radius");
            }
          }
        }

        lastTimestamp.current = timestamp;

        if (shouldContinue && play) {
          raf.current = requestAnimationFrame(animate);
        } else {
          raf.current = null;
        }
      } else {
        if (play) {
          raf.current = requestAnimationFrame(animate);
        }
      }
    };

    raf.current = requestAnimationFrame(animate);
    addStartCircle(map);
  };
  let count = 0;
  // Animate visited edges
  const animateVisited = () => {
    const batchSize = anim[sideStatus.speed][1]; // 🔥 Make batch size dynamic
    let addedAny = false;

    // Add the next batch of segments
    for (let i = 0; i < batchSize && vIdx.current < visited.length; i++) {
      const seg = visited[vIdx.current];
      if (seg?.coords) {
        const [a, b] = seg.coords;
        if (Array.isArray(a) && Array.isArray(b)) {
          visitedLine.current.push({
            type: "Feature",
            geometry: { type: "LineString", coordinates: [a, b] },
            properties: { id: seg.id },
          });
          addedAny = true;
        }
      }
      vIdx.current += 1;
    }

    // Update the source only if new segments were added
    if (addedAny) {
      const vSrc = map.getSource("Visited");
      if (vSrc) {
        vSrc.setData({
          type: "FeatureCollection",
          features: visitedLine.current,
        });
      }
    }

    // Return true if more segments remain
    return vIdx.current < visited.length;
  };

  // Animate path
  const animatePath = () => {
    if (pIdx.current >= path.length) return false;

    const node = path[pIdx.current];
    const coords = node?.coords;

    if (Array.isArray(coords)) {
      const lastCoord = pathLine.current[pathLine.current.length - 1];
      // Only add if different from last coordinate
      if (
        !lastCoord ||
        lastCoord[0] !== coords[0] ||
        lastCoord[1] !== coords[1]
      ) {
        pathLine.current.push(coords);

        const pSrc = map.getSource("Path");
        if (pSrc) {
          pSrc.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: pathLine.current },
          });
        }
      }
    }

    pIdx.current += 1;
    return pIdx.current < path.length;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelRAF();
  }, []);

  return null;
}

export default PathAnimator;
