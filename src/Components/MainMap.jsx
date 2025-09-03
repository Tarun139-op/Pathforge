import React, { useState, useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MainMap({
  setPath,
  setVisited,
  map,
  setMap,
  startNode,
  setStartNode,
  endNode,
  setEndNode,
  mapDetails,
  setMapDetails,
  calculating,
  setCalculating,
  setError,
  clearpath,
  navbar,
  sideStatus,
  right,
  setRight,
}) {
  // Graph data state
  const [graph, setGraph] = useState(null);
  const [nodesCoords, setNodesCoords] = useState(null);

  // Map container & markers
  const mapContainerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  //Map Themes
  const mapThemes = {
    light: "mapbox://styles/mapbox/light-v11", // Light theme
    dark: "mapbox://styles/mapbox/dark-v11", // Dark theme
    outdoors: "mapbox://styles/mapbox/outdoors-v12", // Outdoors (terrain + hiking trails)
    day: "mapbox://styles/mapbox/navigation-day-v1", // Streets (best for daytime)
    night: "mapbox://styles/mapbox/navigation-night-v1", // Night navigation style
  };

  // ------------------ Helper Functions ------------------ //
  const overpassToGeoJSONNodes = useCallback((overpassData) => {
    return {
      type: "FeatureCollection",
      features: (overpassData?.elements ?? [])
        .filter((el) => el.type === "node")
        .map((el) => ({
          type: "Feature",
          id: el.id,
          geometry: { type: "Point", coordinates: [el.lon, el.lat] },
          properties: { ...el.tags, osm_type: "node", osm_id: el.id },
        })),
    };
  }, []);

  const overpassToGeoJSONWays = useCallback((overpassData) => {
    return {
      type: "FeatureCollection",
      features: (overpassData?.elements ?? [])
        .filter((el) => el.type === "way" && el.tags?.highway && el.geometry)
        .map((el) => ({
          type: "Feature",
          id: el.id,
          geometry: {
            type: "LineString",
            coordinates: el.geometry.map((pt) => [pt.lon, pt.lat]),
          },
          properties: {
            ...el.tags,
            osm_type: "way",
            osm_id: el.id,
            nodeRefs: el.nodes,
          },
        })),
    };
  }, []);

  const buildAdjacencyList = useCallback((geojsonWays) => {
    const adjacencyList = {};
    geojsonWays.features.forEach((feature) => {
      const nodeIds = feature.properties.nodeRefs;
      const coords = feature.geometry.coordinates;

      for (let i = 0; i < nodeIds.length - 1; i++) {
        const fromId = String(nodeIds[i]);
        const toId = String(nodeIds[i + 1]);
        const fromCoord = coords[i];
        const toCoord = coords[i + 1];

        const distance = turf.distance(
          turf.point(fromCoord),
          turf.point(toCoord),
          { units: "meters" }
        );

        if (!adjacencyList[fromId]) adjacencyList[fromId] = [];
        if (!adjacencyList[toId]) adjacencyList[toId] = [];

        adjacencyList[fromId].push({ node: toId, weight: distance });
        adjacencyList[toId].push({ node: fromId, weight: distance });
      }
    });
    return adjacencyList;
  }, []);

  const buildNodesList = useCallback((geojsonWays) => {
    const nodesList = {};
    geojsonWays.features.forEach((feature) => {
      const nodeIds = feature.properties.nodeRefs;
      const coords = feature.geometry.coordinates;
      for (let i = 0; i < nodeIds.length; i++) {
        const id = String(nodeIds[i]);
        if (!nodesList[id]) nodesList[id] = coords[i];
      }
    });
    return nodesList;
  }, []);

  // ------------------ Overpass API Calls ------------------ //
  const fetchNearestHighwayNode = useCallback(
    async ([lng, lat]) => {
      const query = `
        [out:json];
        (
          way["highway"](around:100,${lat},${lng});
          >;
        );
        out body;
      `;
      const url =
        "https://overpass-api.de/api/interpreter?data=" +
        encodeURIComponent(query);
      // define sleep helper
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      await sleep(1000);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Overpass fetch failed");
      const data = await res.json();
      const nodesFC = overpassToGeoJSONNodes(data);

      if (!nodesFC.features.length) return null;

      let nearest = null;
      let minDistance = Infinity;
      const pt = turf.point([lng, lat]);

      for (const f of nodesFC.features) {
        const d = turf.distance(pt, f, { units: "meters" });
        if (d < minDistance) {
          minDistance = d;
          nearest = f;
        }
      }

      return minDistance <= 200 ? nearest : null;
    },
    [overpassToGeoJSONNodes]
  );

  const getGraphData = useCallback(
    async ([lng, lat]) => {
      setRight(true);
      setCalculating(true);
      setError({
        type: "info",
        message: "Fetching All nodes......",
        duration: 150000,
      });
      const query = `
        [out:json];
        (
          way["highway"](around:${sideStatus.radius},${lat},${lng});
          >;
        );
        out geom;
      `;
      const url =
        "https://overpass-api.de/api/interpreter?data=" +
        encodeURIComponent(query);

      try {
        // define sleep helper
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        await sleep(1000);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Graph data fetch failed.");
        const data = await res.json();

        const waysGeo = overpassToGeoJSONWays(data);
        const adj = buildAdjacencyList(waysGeo);
        const nodes = buildNodesList(waysGeo);

        setGraph(adj);
        setNodesCoords(nodes);
        setMapDetails((prev) => ({
          ...prev,
          total_graph_nodes: Object.keys(adj).length,
        }));
      } catch (err) {
        console.log(err);

        setError({
          type: "error",
          message: "Graph data fetch failed.",
          duration: 5000,
        });
      } finally {
        setRight(false);
        setError({
          type: "success",
          message: "Fetching Done",
          duration: 3000,
        });
        setCalculating(false);
      }
    },
    [
      sideStatus.radius,
      overpassToGeoJSONWays,
      buildAdjacencyList,
      buildNodesList,
    ]
  );

  // ------------------ Effects ------------------ //

  // Effect 1: Initialize map (once)
  useEffect(() => {
    if (map) return; // already initialized

    setCalculating(true);
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [77.209, 28.6139],
      zoom: 12,
    });
    //navigation bar zoom,direction
    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");

    //navigation bar with locate me
    const geoControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: false,
    });

    mapInstance.addControl(geoControl);

    // when location is found, force a flyTo
    geoControl.on("geolocate", (e) => {
      const { longitude, latitude } = e.coords;

      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: 15, // how close you want
        speed: 1.2, // animation speed
        curve: 1.4, // smoother curve
        essential: true,
      });
    });

    //Navigation for ZOOM scale
    mapInstance.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 200,
        unit: "metric",
      })
    );

    mapInstance.addControl(new mapboxgl.FullscreenControl());

    mapInstance.on("load", () => {
      mapInstance.addSource("start-circle", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      mapInstance.addLayer({
        id: "start-circle-layer",
        type: "fill",
        source: "start-circle",
        paint: {
          "fill-color": sideStatus.radius_color,
          "fill-opacity": 0.12,
          "fill-outline-color": "green",
        },
      });
      setCalculating(false);
    });

    setMap(mapInstance);
    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, [setMap]);

  useEffect(() => {
    setMapDetails([]);
  }, [startNode, sideStatus.radius]);

  //#region useeffect sidestatus
  // ✅ GOOD - Theme updates (async)
  useEffect(() => {
    if (!map || !sideStatus.theme) return;

    map.setStyle(mapThemes[sideStatus.theme]);

    map.once("style.load", () => {
      if (startNode) {
        const circle = turf.circle(
          [startNode.lon, startNode.lat],
          sideStatus.radius / 1000,
          { steps: 64, units: "kilometers" }
        );

        map.addSource("start-circle", { type: "geojson", data: circle });
        map.addLayer({
          id: "start-circle-layer",
          type: "fill",
          source: "start-circle",
          paint: {
            "fill-color": sideStatus.radius_color,
            "fill-opacity": 0.3,
          },
        });
      }

      // Re-add or update line layers properly
      ["Visited", "Path"].forEach((layer) => {
        if (map.getLayer(layer)) {
          map.setPaintProperty(
            layer,
            "line-width",
            sideStatus[layer.toLowerCase()]
          );
        } else {
          // TODO: re-add the line layer if your app originally had it
          // map.addLayer({ ...your layer config... });
        }
      });
    });
  }, [map, sideStatus.theme]);

  // ✅ GOOD - Radius color updates
  useEffect(() => {
    if (!map || !sideStatus.radius_color) return;

    const updateColor = () => {
      const source = map.getSource("start-circle");
      if (source) {
        map.setPaintProperty(
          "start-circle-layer",
          "fill-color",
          sideStatus.radius_color
        );
      }
    };

    if (map.isStyleLoaded()) {
      updateColor();
    } else {
      map.once("styledata", updateColor);
    }
  }, [map, sideStatus.radius_color]); // Only when color changes

  // ✅ GOOD - Radius size updates
  useEffect(() => {
    if (!map || !startNode || !sideStatus.radius) return;

    const circle = turf.circle(
      [startNode.lon, startNode.lat],
      sideStatus.radius / 1000,
      {
        steps: 64,
        units: "kilometers",
      }
    );

    const source = map.getSource("start-circle");
    if (source) {
      source.setData(circle);
    }
    if (startNode?.lon && startNode?.lat) {
      getGraphData([startNode.lon, startNode.lat]);
    }
  }, [map, startNode, sideStatus.radius]); // Only when radius changes

  // ✅ GOOD - City/location updates
  useEffect(() => {
    if (!map || !sideStatus.city) return;

    const cityCoords = {
      "new-delhi": [77.209, 28.6139],
      bangalore: [77.5946, 12.9716],
      london: [-0.1276, 51.5072],
      paris: [2.3522, 48.8566],
      moscow: [37.6173, 55.7558],
      mumbai: [72.8777, 19.076],
      tokyo: [139.6917, 35.6895],
      "new-york": [-74.006, 40.7128],
      california: [-119.4179, 36.7783],
      singapore: [103.8198, 1.3521],
      rome: [12.4964, 41.9028],
      sydney: [151.2093, -33.8688],
      amsterdam: [4.9041, 52.3676],
    };

    if (cityCoords[sideStatus.city]) {
      map.flyTo({
        center: cityCoords[sideStatus.city],
        zoom: 12,
        speed: 1,
      });
    }
  }, [map, sideStatus.city]); // Only when city changes

  // ✅ GOOD - Animation line styling
  useEffect(() => {
    if (!map) return;

    const updateLineStyles = () => {
      // Update visited line color
      if (map.getLayer("Visited") && sideStatus.visited) {
        map.setPaintProperty("Visited", "line-color", sideStatus.visited);
      }

      // Update final path line color
      if (map.getLayer("Path") && sideStatus.final_path) {
        map.setPaintProperty("Path", "line-color", sideStatus.final_path);
      }
    };

    if (map.isStyleLoaded()) {
      updateLineStyles();
    } else {
      map.once("styledata", updateLineStyles);
    }
  }, [map, sideStatus.visited, sideStatus.final_path]);

  //#endregion
  const rightRef = useRef(right);
  useEffect(() => {
    rightRef.current = right; // keep ref in sync with state
  }, [right]);
  // Effect 2: Add map click handlers
  useEffect(() => {
    if (!map) return;
    //Left Click logic here
    const handleClick = async (e) => {
      clearpath();
      setCalculating(true);
      try {
        const nearest = await fetchNearestHighwayNode([
          e.lngLat.lng,
          e.lngLat.lat,
        ]);
        if (!nearest) {
          setError({
            type: "warning",
            message:
              "No highway node nearby. Zoom in or click closer to a road.",
            duration: 5000,
          });
          return;
        }

        if (startMarkerRef.current) startMarkerRef.current.remove();
        if (endMarkerRef.current) endMarkerRef.current.remove();

        const [nodeLng, nodeLat] = nearest.geometry.coordinates;
        startMarkerRef.current = new mapboxgl.Marker({ color: "green" })
          .setLngLat([nodeLng, nodeLat])
          .addTo(map);

        const circle = turf.circle(
          [nodeLng, nodeLat],
          sideStatus.radius / 1000,
          {
            steps: 64,
            units: "kilometers",
          }
        );
        map.getSource("start-circle").setData(circle);

        setStartNode({ id: String(nearest.id), lon: nodeLng, lat: nodeLat });
        setEndNode(null);
        setGraph(null);
        setNodesCoords(null);
      } catch (err) {
        console.error(err);
        setError({
          type: "error",
          message: "Error Picking Start Node",
          duration: 3000,
        });
      } finally {
        setCalculating(false);
      }
    };
    //Right Click logic here
    const handleRightClick = async (e) => {
      if (rightRef.current) {
        setError({
          type: "warning",
          message: "Wait till fetching is done.....",
          duration: 300000,
        });

        return;
      }
      setCalculating(true);
      clearpath();
      try {
        if (!startMarkerRef.current) {
          setError({
            type: "warning",
            message: "Pick a start point first (left click).",
            duration: 3000,
          });

          return;
        }

        const startLngLat = startMarkerRef.current.getLngLat();
        const distFromStart = turf.distance(
          turf.point([startLngLat.lng, startLngLat.lat]),
          turf.point([e.lngLat.lng, e.lngLat.lat]),
          { units: "meters" }
        );

        if (distFromStart > sideStatus.radius) {
          setError({
            type: "warning",
            message: "Click inside start radius.",
            duration: 3000,
          });

          return;
        }

        const nearest = await fetchNearestHighwayNode([
          e.lngLat.lng,
          e.lngLat.lat,
        ]);
        if (!nearest) {
          setError({
            type: "warning",
            message: "No highway node near that point.",
            duration: 3000,
          });

          return;
        }

        if (endMarkerRef.current) endMarkerRef.current.remove();
        const [nodeLng, nodeLat] = nearest.geometry.coordinates;
        endMarkerRef.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat([nodeLng, nodeLat])
          .addTo(map);

        setEndNode({ id: String(nearest.id), lon: nodeLng, lat: nodeLat });
      } catch (err) {
        console.error(err);
        setError({
          type: "error",
          message: "Error picking end node.",
          duration: 3000,
        });
      } finally {
        setCalculating(false);
      }
    };

    map.on("click", handleClick);
    map.on("contextmenu", handleRightClick);

    return () => {
      map.off("click", handleClick);
      map.off("contextmenu", handleRightClick);
    };
  }, [map, fetchNearestHighwayNode, sideStatus.radius]);

  // Effect 3: Fetch graph data when new startNode set
  useEffect(() => {
    if (startNode?.lon && startNode?.lat) {
      getGraphData([startNode.lon, startNode.lat]);
    }
  }, [startNode, getGraphData]);

  // Effect 4: Run algo in worker when graph ready
  useEffect(() => {
    if (!graph || !nodesCoords || !startNode?.id || !endNode?.id) return;

    const worker = new Worker(
      new URL("../workers/worker-utils.js", import.meta.url),
      { type: "module" }
    );

    worker.postMessage({
      type: "RUN_ALGO",
      algo: sideStatus.algorithm,
      adj: graph,
      startId: startNode.id,
      endId: endNode.id,
      nodesMap: nodesCoords,
    });

    worker.onmessage = (e) => {
      if (e.data.status === "success" && e.data.type === "RESULT") {
        const { edges, path } = e.data.result;

        setVisited(edges);
        setPath(path);
        setMapDetails((prev) => ({
          ...prev,
          visited_nodes: edges.length,
          path_nodes: path.length,
        }));
      } else if (e.data.status === "error") {
        console.error("Worker error:", e.data.error);
        setError({
          type: "error",
          message: e.data.error || "Worker failed to run algorithm.",
          duration: 5000,
        });
        setCalculating(false);
      }
    };

    return () => {
      worker.terminate();
      setCalculating(false); // clean up in case component unmounts
    };
  }, [startNode, endNode]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full transition-all duration-500  ${
        navbar ? "blur-[3px] pointer-events-none" : ""
      }`}
      style={{ height: "100vh" }}
    />
  );
}
