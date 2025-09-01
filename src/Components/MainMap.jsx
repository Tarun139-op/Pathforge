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
  setMapDetails,
  setCalculating,
  setError,
  clearpath,
  navbar,
  sideStatus,
}) {
  // ======================= STATE =======================
  const [graph, setGraph] = useState(null);
  const [nodesCoords, setNodesCoords] = useState(null);

  // Map refs (container + markers)
  const mapContainerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);

  // Map themes (available mapbox styles)
  const mapThemes = {
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
    outdoors: "mapbox://styles/mapbox/outdoors-v12",
    day: "mapbox://styles/mapbox/navigation-day-v1",
    night: "mapbox://styles/mapbox/navigation-night-v1",
  };

  const openFullscreen = () => {
    const elem = mapContainerRef.current;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  // ======================= HELPERS =======================

  // Convert overpass nodes into GeoJSON
  const overpassToGeoJSONNodes = useCallback(
    (overpassData) => ({
      type: "FeatureCollection",
      features: (overpassData?.elements ?? [])
        .filter((el) => el.type === "node")
        .map((el) => ({
          type: "Feature",
          id: el.id,
          geometry: { type: "Point", coordinates: [el.lon, el.lat] },
          properties: { ...el.tags, osm_type: "node", osm_id: el.id },
        })),
    }),
    []
  );

  // Convert overpass ways into GeoJSON
  const overpassToGeoJSONWays = useCallback(
    (overpassData) => ({
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
    }),
    []
  );

  // Build adjacency list for graph algo
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

  // Build nodes list for ID -> coordinates mapping
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

  // Find nearest highway node (so clicks snap to road)
  const fetchNearestHighwayNode = useCallback(
    async ([lng, lat]) => {
      const query = `
      [out:json];
      ( way["highway"](around:100,${lat},${lng}); >; );
      out body;
    `;
      const url =
        "https://overpass-api.de/api/interpreter?data=" +
        encodeURIComponent(query);

      await new Promise((r) => setTimeout(r, 1000)); // sleep
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

  // Get graph data from Overpass
  const getGraphData = useCallback(
    async ([lng, lat]) => {
      setError({ type: "info", message: "Fetching all nodes..." });

      const query = `
      [out:json];
      ( way["highway"](around:${sideStatus.radius},${lat},${lng}); >; );
      out geom;
    `;
      const url =
        "https://overpass-api.de/api/interpreter?data=" +
        encodeURIComponent(query);

      try {
        await new Promise((r) => setTimeout(r, 1000));
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
        setError({ type: "success", message: "Fetching done" });
      } catch (err) {
        console.log(err);
        setError({ type: "error", message: "Graph data fetch failed." });
      }
    },
    [
      sideStatus.radius,
      overpassToGeoJSONWays,
      buildAdjacencyList,
      buildNodesList,
    ]
  );

  // ======================= EFFECTS =======================

  // Init map once
  useEffect(() => {
    if (map) return; // don’t double-init

    setCalculating(true);
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [77.209, 28.6139], // default: New Delhi
      zoom: 12,
    });

    // Basic controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapInstance.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 200, unit: "metric" })
    );
    //#region navigation

    mapInstance.addControl(
      new mapboxgl.FullscreenControl({
        container: document.querySelector("body"),
      })
    );

    //#endregion

    // Geo locate (locate me button)
    const geoControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
      showAccuracyCircle: false,
    });
    mapInstance.addControl(geoControl);

    geoControl.on("geolocate", (e) => {
      const { longitude, latitude } = e.coords;
      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        speed: 1.2,
        curve: 1.4,
      });
    });

    // Setup start circle layer
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

  // Reset map details when start/radius changes
  useEffect(() => {
    setMapDetails([]);
  }, [startNode, sideStatus.radius]);

  // Theme switching
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
          paint: { "fill-color": sideStatus.radius_color, "fill-opacity": 0.3 },
        });
      }

      // Update line layers if they exist
      ["Visited", "Path"].forEach((layer) => {
        if (map.getLayer(layer)) {
          map.setPaintProperty(
            layer,
            "line-width",
            sideStatus[layer.toLowerCase()]
          );
        }
      });
    });
  }, [map, sideStatus.theme]);

  // Update radius color
  useEffect(() => {
    if (!map || !sideStatus.radius_color) return;
    const updateColor = () => {
      if (map.getSource("start-circle")) {
        map.setPaintProperty(
          "start-circle-layer",
          "fill-color",
          sideStatus.radius_color
        );
      }
    };
    map.isStyleLoaded() ? updateColor() : map.once("styledata", updateColor);
  }, [map, sideStatus.radius_color]);

  // Update radius size
  useEffect(() => {
    if (!map || !startNode || !sideStatus.radius) return;
    const circle = turf.circle(
      [startNode.lon, startNode.lat],
      sideStatus.radius / 1000,
      { steps: 64, units: "kilometers" }
    );
    const source = map.getSource("start-circle");
    if (source) source.setData(circle);
    if (startNode?.lon && startNode?.lat)
      getGraphData([startNode.lon, startNode.lat]);
  }, [map, startNode, sideStatus.radius]);

  // Move to city when changed
  useEffect(() => {
    if (!map || !sideStatus.city) return;
    const cityCoords = {
      "new-delhi": [77.209, 28.6139],
      mumbai: [72.8777, 19.076],
      bangalore: [77.5946, 12.9716],
      london: [-0.1276, 51.5072],
      paris: [2.3522, 48.8566],
      moscow: [37.6173, 55.7558],
      tokyo: [139.6917, 35.6895],
      "new-york": [-74.006, 40.7128],
      california: [-119.4179, 36.7783],
      singapore: [103.8198, 1.3521],
      rome: [12.4964, 41.9028],
      sydney: [151.2093, -33.8688],
      amsterdam: [4.9041, 52.3676],
    };
    if (cityCoords[sideStatus.city]) {
      map.flyTo({ center: cityCoords[sideStatus.city], zoom: 12, speed: 1 });
    }
  }, [map, sideStatus.city]);

  // Update line colors
  useEffect(() => {
    if (!map) return;
    const updateLineStyles = () => {
      if (map.getLayer("Visited") && sideStatus.visited)
        map.setPaintProperty("Visited", "line-color", sideStatus.visited);
      if (map.getLayer("Path") && sideStatus.final_path)
        map.setPaintProperty("Path", "line-color", sideStatus.final_path);
    };
    map.isStyleLoaded()
      ? updateLineStyles()
      : map.once("styledata", updateLineStyles);
  }, [map, sideStatus.visited, sideStatus.final_path]);

  // Click (left=start, right=end)
  useEffect(() => {
    if (!map) return;

    // Left click = set start node
    const handleClick = async (e) => {
      clearpath();
      setCalculating(true);
      try {
        const nearest = await fetchNearestHighwayNode([
          e.lngLat.lng,
          e.lngLat.lat,
        ]);
        if (!nearest)
          return setError({
            type: "warning",
            message:
              "No highway node nearby. Zoom in or click closer to a road.",
          });

        if (startMarkerRef.current) startMarkerRef.current.remove();
        if (endMarkerRef.current) endMarkerRef.current.remove();

        const [nodeLng, nodeLat] = nearest.geometry.coordinates;
        startMarkerRef.current = new mapboxgl.Marker({ color: "green" })
          .setLngLat([nodeLng, nodeLat])
          .addTo(map);

        const circle = turf.circle(
          [nodeLng, nodeLat],
          sideStatus.radius / 1000,
          { steps: 64, units: "kilometers" }
        );
        map.getSource("start-circle").setData(circle);

        setStartNode({ id: String(nearest.id), lon: nodeLng, lat: nodeLat });
        setEndNode(null);
        setGraph(null);
        setNodesCoords(null);
      } catch (err) {
        console.error(err);
        setError({ type: "error", message: "Error picking start node" });
      } finally {
        setCalculating(false);
      }
    };

    // Right click = set end node
    const handleRightClick = async (e) => {
      setCalculating(true);
      clearpath();
      try {
        if (!startMarkerRef.current)
          return setError({
            type: "warning",
            message: "Pick a start point first (left click).",
          });

        const startLngLat = startMarkerRef.current.getLngLat();
        const distFromStart = turf.distance(
          turf.point([startLngLat.lng, startLngLat.lat]),
          turf.point([e.lngLat.lng, e.lngLat.lat]),
          { units: "meters" }
        );
        if (distFromStart > sideStatus.radius)
          return setError({
            type: "warning",
            message: "Click inside start radius.",
          });

        const nearest = await fetchNearestHighwayNode([
          e.lngLat.lng,
          e.lngLat.lat,
        ]);
        if (!nearest)
          return setError({
            type: "warning",
            message: "No highway node near that point.",
          });

        if (endMarkerRef.current) endMarkerRef.current.remove();
        const [nodeLng, nodeLat] = nearest.geometry.coordinates;
        endMarkerRef.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat([nodeLng, nodeLat])
          .addTo(map);

        setEndNode({ id: String(nearest.id), lon: nodeLng, lat: nodeLat });
      } catch (err) {
        console.error(err);
        setError({ type: "error", message: "Error picking end node" });
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

  // Run algo in worker when graph is ready
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
        });
        setCalculating(false);
      }
    };
    return () => {
      worker.terminate();
      setCalculating(false);
    };
  }, [graph, nodesCoords, startNode, endNode]);

  // ======================= RENDER =======================
  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full transition-all duration-500 ${
        navbar ? "blur-[3px] pointer-events-none" : ""
      }`}
      style={{ height: "100vh" }}
    />
  );
}
