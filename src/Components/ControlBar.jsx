import React, { useState, useEffect } from "react";
import { IoMdSettings } from "react-icons/io";
import { IoIosPlay } from "react-icons/io";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { IoIosPause } from "react-icons/io";
import { FaGithub } from "react-icons/fa"; // Add this import

function ControlBar({
  mapDetails,
  calculating,
  error,
  setError,
  clearpath,
  play,
  setPlay,
  navbar,
  setNavbar,
  sideStatus,
  setSidestatus,
  animating,
}) {
  const [sideStatus_temp, setSidestatus_temp] = useState({});

  // Add your GitHub URL here - customize this
  const GITHUB_URL = "https://github.com/Tarun139-op/Pathforge"; // ← Change this to your GitHub URL

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), error.duration);
      return () => clearTimeout(timer); // cleanup if component unmounts
    }
  }, [error]);

  useEffect(() => {
    if (navbar) setSidestatus_temp(sideStatus);
  }, [navbar]);

  return (
    <div className="flex flex-col">
      {/* Shows Settings and Play/Pause Button  and Clear Path*/}
      <div
        className={`absolute top-4 left-20 space-x-8 z-2 transform transition-all duration-300 flex ease-in-out
  ${
    navbar ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
  }`}
      >
        <button
          className={` p-2 rounded-full shadow-md hover:bg-gray-700 transition opacity-100 ${
            animating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
          disabled={animating}
          onClick={() => {
            setNavbar(true);
          }}
        >
          <IoMdSettings className="w-6 h-6 text-white" />
        </button>
        <div className="flex justify-center items-center ml-90 px-4 space-x-8 opacity-80">
          <button
            onClick={() => setPlay((prev) => !prev)}
            className={` p-2 rounded-full shadow-md transition ${
              !animating
                ? "bg-green-200 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-300 "
            } `}
            disabled={!animating}
          >
            {play ? (
              <IoIosPlay className="w-6 h-6 text-white" />
            ) : (
              <IoIosPause className="w-6 h-6 text-white" />
            )}
          </button>
          <button
            onClick={() => {
              clearpath();
            }}
            className={`p-2 rounded-xl shadow-md  transition w-32  ${
              animating
                ? "bg-gray-300  cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-700 "
            } `}
            disabled={animating}
          >
            <span className="font-medium text-white">CLEAR PATH</span>
          </button>
        </div>
      </div>

      {/* GitHub Icon - Bottom Left Corner */}
      <div
        className={`fixed bottom-24 left-12 z-40 transform transition-all duration-500 ease-in-out
          ${
            navbar
              ? "opacity-0 scale-75 pointer-events-none translate-x-[-20px]"
              : "opacity-100 scale-100 translate-x-0"
          }`}
      >
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-gray-900/80 backdrop-blur-sm hover:bg-gray-800 
                   p-3 rounded-full shadow-lg border border-gray-700/50
                   transition-all duration-300 hover:scale-110 hover:shadow-xl
                   hover:border-gray-600 flex items-center justify-center"
          title="View on GitHub"
        >
          <FaGithub className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors duration-300" />
        </a>
      </div>

      {/* Shows Total Nodes in area, Total Visited Nodes, Total Final Path Nodes etc. */}
      <div
        className={`absolute top-0 right-2 space-x-8 z-2 transform transition-all duration-300 ease-in-out w-1/5 h-auto flex flex-col justify-center bg-white/20 rounded-xl  `}
      >
        <div className="text-black pl-2">
          {mapDetails.total_graph_nodes
            ? `Total nodes in current area: ${mapDetails.total_graph_nodes}`
            : ""}
        </div>
        <div className="text-black pl-2">
          {" "}
          {mapDetails.visited_nodes
            ? `Total visited node: ${mapDetails.visited_nodes}`
            : ""}
        </div>
        <div className="text-black pl-2">
          {" "}
          {mapDetails.path_nodes
            ? `Total nodes in final path: ${mapDetails.path_nodes}`
            : ""}
        </div>
      </div>

      {/* Shows any error or loading status */}
      <div
        className={`absolute bottom-6 right-2 space-x-8 z-2 transform transition-all duration-300 ease-in-out w-1/4 h-1/4 flex flex-col text-white justify-center items-center `}
      >
        {calculating && (
          <img
            src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGY0Z2gzYzdyeDVzeGxveWtseTZtZWxyaW1vbHZxbGwxMHp4OWpsayZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/yyqOUPn5souNBSHUnU/giphy.webp"
            alt="Loading..."
            className="w-24 opacity-90 rounded-full m-4"
          />
        )}

        {error.message && (
          <div
            id="alert-border-2"
            className={`flex items-center p-4 mb-4 text-sm border-t-4 rounded-lg 
      ${
        error.type === "error"
          ? "text-red-800 border-red-300 bg-red-50 dark:text-red-400 dark:bg-gray-800 dark:border-red-800"
          : error.type === "warning"
          ? "text-yellow-800 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:bg-gray-800 dark:border-yellow-800"
          : error.type === "success"
          ? "text-green-800 border-green-300 bg-green-50 dark:text-green-400 dark:bg-gray-800 dark:border-green-800"
          : "text-blue-800 border-blue-300 bg-blue-50 dark:text-blue-400 dark:bg-gray-800 dark:border-blue-800"
      }`}
            role="alert"
          >
            <svg
              className="shrink-0 w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <div className="ms-3 font-medium">{error.message}</div>
          </div>
        )}
      </div>

      {/* Main Control Bar from left side */}
      <div
        className={`w-80 h-dvh bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 
        fixed top-0 left-0 z-50 transform transition-transform duration-500 ease-in-out 
        flex flex-col shadow-2xl border-r border-slate-700/50
        ${
          navbar ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="w-full flex justify-between items-center p-2 border-b border-slate-700/30">
          <h2 className="text-lg font-bold text-white">Map Controls</h2>
          <button
            className="p-2 rounded-full hover:bg-slate-700/50 transition-all duration-300 
               transform hover:scale-110 group"
            onClick={() => {
              setNavbar(false);
              setSidestatus({ ...sideStatus_temp });
            }}
          >
            <IoMdCloseCircleOutline className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Main Content Grid (no scroll, auto-fit) */}
        <div className="flex-1 grid grid-rows-[auto_auto_auto_auto_auto_auto] gap-4 p-4">
          {/* Map Theme */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Map Theme
            </h3>
            <div className="flex flex-wrap w-auto ">
              {[
                { label: "Light", value: "light", img: "/themes/light.jpg" },
                { label: "Dark", value: "dark", img: "/themes/dark.jpg" },
                {
                  label: "Outdoors",
                  value: "outdoors",
                  img: "/themes/outdoors.jpg",
                },
                { label: "Day", value: "day", img: "/themes/day.jpg" },
                { label: "Night", value: "night", img: "/themes/night.jpg" },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`relative overflow-hidden rounded-2xl cursor-pointer
                        transition-all duration-300 hover:scale-105 border-2 m-1
                        ${
                          sideStatus_temp.theme === item.value
                            ? "border-blue-400 shadow-lg shadow-blue-400/25"
                            : "border-slate-700 hover:border-slate-500"
                        }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    value={item.value}
                    checked={sideStatus_temp.theme === item.value}
                    onChange={(e) => {
                      setSidestatus_temp((prev) => ({
                        ...prev,
                        theme: e.target.value,
                      }));
                    }}
                    className="hidden peer"
                  />
                  {/* Background image */}
                  <div className="h-8 w-18 flex items-center justify-center bg-cover bg-center rounded-2xl">
                    <span className="text-white text-xs font-semibold px-2 py-1 rounded">
                      {item.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* City Selection */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Select City
            </h3>
            <select
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm
                   text-white cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-400 focus:border-transparent transition-all"
              value={sideStatus_temp.city || ""}
              onChange={(e) => {
                setSidestatus_temp((prev) => ({
                  ...prev,
                  city: e.target.value,
                }));
              }}
            >
              {/* <option value="">-- Select City --</option> */}
              <option value="new-delhi">🇮🇳 New Delhi</option>
              <option value="london">🇬🇧 London</option>
              <option value="paris">🇫🇷 Paris</option>
              <option value="bangalore">🇮🇳 Bangalore</option>
              <option value="moscow">🇷🇺 Moscow</option>
              <option value="mumbai">🇮🇳 Mumbai</option>
              <option value="tokyo">🇯🇵 Tokyo</option>
              <option value="new-york">🇺🇸 New York</option>
              <option value="california">🇺🇸 California</option>
              <option value="singapore">🇸🇬 Singapore</option>
              <option value="rome">🇮🇹 Rome</option>
              <option value="sydney">🇦🇺 Sydney</option>
              <option value="amsterdam">🇳🇱 Amsterdam</option>
            </select>
          </div>

          {/* Algorithm Selection */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Algorithm
            </h3>
            <select
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm
                   text-white cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-400 focus:border-transparent transition-all"
              value={sideStatus_temp.algorithm || ""}
              onChange={(e) => {
                setSidestatus_temp((prev) => ({
                  ...prev,
                  algorithm: e.target.value,
                }));
              }}
            >
              <option value="">Select Algorithm</option>
              <option value="djikstra">🔍 Djikstra</option>
              <option value="astar">⭐ A*</option>
              <option value="greedy">🚀 Greedy</option>
              <option value="bidirectional">🔄 BiDirectional</option>
            </select>
          </div>

          {/* Radius Slider */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Area Radius:
            </h3>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={sideStatus_temp.radius ?? sideStatus.radius}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              onChange={(e) => {
                setSidestatus_temp((prev) => ({
                  ...prev,
                  radius: e.target.value,
                }));
              }}
            />
            <p className="flex justify-between text-slate-300 text-xs mt-1">
              {(sideStatus_temp.radius || sideStatus.radius) / 1000} KM
              <span>(2KM Preffered)</span>
            </p>
          </div>

          {/* Speed Slider */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Animation Speed:
            </h3>

            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={(sideStatus_temp.speed ?? sideStatus.speed) + 1}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              onChange={(e) => {
                setSidestatus_temp((prev) => ({
                  ...prev,
                  speed: parseInt(e.target.value, 10) - 1,
                }));
              }}
            />

            <p className="text-slate-300 text-xs mt-1">
              {(sideStatus_temp.speed ?? sideStatus.speed) + 1}
            </p>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <label className="text-xs text-slate-300 my-2">
                Visited Path
              </label>
              <input
                type="color"
                value={sideStatus_temp.visited || "#3b82f6"}
                onChange={(e) =>
                  setSidestatus_temp((prev) => ({
                    ...prev,
                    visited: e.target.value,
                  }))
                }
                className="w-8 h-8 rounded cursor-pointer border border-slate-600"
              />
            </div>
            <div className="flex flex-col items-center">
              <label className="text-xs text-slate-300 my-2">Final Path</label>
              <input
                type="color"
                value={sideStatus_temp.final_path || "#22c55e"}
                onChange={(e) =>
                  setSidestatus_temp((prev) => ({
                    ...prev,
                    final_path: e.target.value,
                  }))
                }
                className="w-8 h-8 rounded cursor-pointer border border-slate-600"
              />
            </div>
            <div className="flex flex-col items-center">
              <label className="text-xs text-slate-300 my-2">
                Radius Color
              </label>
              <input
                type="color"
                value={sideStatus_temp.radius_color || "#00FF00"}
                onChange={(e) =>
                  setSidestatus_temp((prev) => ({
                    ...prev,
                    radius_color: e.target.value,
                  }))
                }
                className="w-8 h-8 rounded cursor-pointer border border-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 text-xs text-slate-400 border-t border-slate-700/30">
          🖱️ Left Click → <span className="text-green-400">Start Node</span> |
          Right Click → <span className="text-red-400">End Node</span>
        </div>
      </div>
    </div>
  );
}

export default ControlBar;
