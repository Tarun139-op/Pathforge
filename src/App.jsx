import { useState, useRef } from "react";
import "./App.css";
import ControlBar from "./Components/ControlBar";
import MainMap from "./Components/MainMap";
import PathAnimator from "./Components/PathAnimator";

function App() {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState({});
  const [path, setPath] = useState([]);
  const [visited, setVisited] = useState([]);
  const [play, setPlay] = useState(100);
  const [animating, setAnimating] = useState(false);
  const [right, setRight] = useState(false);
  // UI state for start/end points
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [mapDetails, setMapDetails] = useState([]);
  const [navbar, setNavbar] = useState(false);
  const [sideStatus, setSidestatus] = useState({
    theme: "dark",
    city: "",
    algorithm: "djikstra",
    radius: 2000,
    speed: 4,
    visited: "#3b82f6",
    final_path: "#00FF00",
    radius_color: "#00FF00",
  });

  const [map, setMap] = useState(null); // store map instance here
  const clearpath = () => {
    setPath([]);
    setVisited([]);
  };
  return (
    <>
      <ControlBar
        mapDetails={mapDetails}
        calculating={calculating}
        error={error}
        setError={setError}
        clearpath={clearpath}
        play={play}
        setPlay={setPlay}
        navbar={navbar}
        setNavbar={setNavbar}
        sideStatus={sideStatus}
        setSidestatus={setSidestatus}
        animating={animating}
      />

      <MainMap
        setPath={setPath}
        setVisited={setVisited}
        map={map}
        setMap={setMap}
        startNode={startNode}
        setStartNode={setStartNode}
        endNode={endNode}
        setEndNode={setEndNode}
        mapDetails={mapDetails}
        setMapDetails={setMapDetails}
        calculating={calculating}
        setCalculating={setCalculating}
        setError={setError}
        clearpath={clearpath}
        navbar={navbar}
        sideStatus={sideStatus}
        right={right}
        setRight={setRight}
      />
      {map && (
        <PathAnimator
          map={map}
          path={path}
          visited={visited}
          play={play}
          sideStatus={sideStatus}
          setAnimating={setAnimating}
          setError={setError}
        />
      )}
    </>
  );
}

export default App;
