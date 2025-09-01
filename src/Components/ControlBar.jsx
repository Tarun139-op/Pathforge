import React, { useState, useEffect } from "react";
import { IoMdSettings, IoMdCloseCircleOutline } from "react-icons/io";
import { IoIosPlay, IoIosPause } from "react-icons/io";
import { FaGithub } from "react-icons/fa";

function ControlBar({
  mapDetails, // stats about the map (nodes, visited, path)
  calculating, // true when algorithm is running
  error, // error object { message, type }
  setError, // clears error
  clearpath, // fn: reset path on map
  play,
  setPlay, // controls play/pause
  navbar,
  setNavbar, // controls settings sidebar
  sideStatus,
  setSidestatus, // global settings
}) {
  const [sideStatus_temp, setSidestatus_temp] = useState({}); // local sidebar state
  const GITHUB_URL = "https://github.com/Tarun139-op/Real-map-pathfinder-tools";

  // Auto-clear error after 5s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // When navbar opens, copy global settings into temp state
  useEffect(() => {
    if (navbar) setSidestatus_temp(sideStatus);
  }, [navbar]);

  return (
    <div className="flex flex-col">
      {/* --- Floating quick controls (settings + play/pause + clear) --- */}
      <div
        className={`absolute top-4 left-20 space-x-8 z-2 flex transform transition-all duration-300
          ${
            navbar
              ? "opacity-0 scale-90 pointer-events-none"
              : "opacity-100 scale-100"
          }`}
      >
        {/* Open Settings Sidebar */}
        <button
          className="bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-700 transition"
          onClick={() => setNavbar(true)}
        >
          <IoMdSettings className="w-6 h-6 text-white" />
        </button>

        {/* Play / Pause + Clear Path */}
        <div className="flex px-4 space-x-8 ml-90 opacity-80">
          <button
            onClick={() => setPlay((prev) => !prev)}
            className="bg-green-500 p-2 rounded-full shadow-md hover:bg-green-300 transition"
          >
            {play ? (
              <IoIosPlay className="w-6 h-6 text-white" />
            ) : (
              <IoIosPause className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={clearpath}
            className="bg-gray-800 p-2 rounded-xl shadow-md hover:bg-gray-700 transition w-32"
          >
            <span className="font-medium text-white">CLEAR PATH</span>
          </button>
        </div>
      </div>

      {/* --- GitHub Link (bottom left) --- */}
      <div
        className={`fixed bottom-20 left-6 z-40 transform transition-all duration-500 ease-in-out
          ${
            navbar
              ? "opacity-0 scale-75 pointer-events-none -translate-x-5"
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
          <FaGithub className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
        </a>
      </div>

      {/* --- Map Stats (top right) --- */}
      <div className="absolute top-0 right-2 w-1/5 flex flex-col space-y-1 p-2 bg-white/20 rounded-xl">
        {mapDetails.total_graph_nodes && (
          <div className="text-black">
            Total nodes: {mapDetails.total_graph_nodes}
          </div>
        )}
        {mapDetails.visited_nodes && (
          <div className="text-black">
            Visited nodes: {mapDetails.visited_nodes}
          </div>
        )}
        {mapDetails.path_nodes && (
          <div className="text-black">
            Final path nodes: {mapDetails.path_nodes}
          </div>
        )}
      </div>

      {/* --- Loader + Errors (bottom right) --- */}
      <div className="absolute bottom-6 right-2 w-1/4 flex flex-col items-center text-white">
        {calculating && (
          <img
            src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGY0Z2gzYzdyeDVzeGxveWtseTZtZWxyaW1vbHZxbGwxMHp4OWpsayZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/yyqOUPn5souNBSHUnU/giphy.webp"
            alt="Loading..."
            className="w-24 rounded-full opacity-90 m-4"
          />
        )}

        {error.message && (
          <div
            role="alert"
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
          >
            <svg
              className="shrink-0 w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <span className="ml-3 font-medium">{error.message}</span>
          </div>
        )}
      </div>

      {/* --- Sidebar: Map Controls --- */}
      <div
        className={`w-80 h-dvh fixed top-0 left-0 z-50 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          shadow-2xl border-r border-slate-700/50
          transform transition-transform duration-500 ease-in-out
          ${
            navbar ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
      >
        {/* Sidebar Header */}
        <div className="flex justify-between items-center p-2 border-b border-slate-700/30">
          <h2 className="text-lg font-bold text-white">Map Controls</h2>
          <button
            onClick={() => {
              setNavbar(false);
              setSidestatus({ ...sideStatus_temp }); // push local state to global
            }}
            className="p-2 rounded-full hover:bg-slate-700/50 transition-all hover:scale-110"
          >
            <IoMdCloseCircleOutline className="w-6 h-6 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 grid gap-4 p-4">
          {/* Map Theme Selection */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Map Theme
            </h3>
            <div className="flex flex-wrap">
              {[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
                { label: "Outdoors", value: "outdoors" },
                { label: "Day", value: "day" },
                { label: "Night", value: "night" },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`m-1 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105
                    ${
                      sideStatus_temp.theme === item.value
                        ? "border-blue-400 shadow-lg shadow-blue-400/25"
                        : "border-slate-700 hover:border-slate-500"
                    }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={item.value}
                    checked={sideStatus_temp.theme === item.value}
                    onChange={(e) =>
                      setSidestatus_temp((prev) => ({
                        ...prev,
                        theme: e.target.value,
                      }))
                    }
                    className="hidden"
                  />
                  <div className="h-8 w-18 flex items-center justify-center rounded-2xl">
                    <span className="text-white text-xs font-semibold">
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
              value={sideStatus_temp.city || ""}
              onChange={(e) =>
                setSidestatus_temp((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white 
                         cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="new-delhi">
                🇮🇳 &nbsp; &nbsp; &nbsp;New Delhi
              </option>
              <option value="london">🇬🇧 &nbsp; &nbsp; &nbsp;London</option>
              <option value="paris">🇫🇷 &nbsp; &nbsp; &nbsp;Paris</option>
              <option value="bangalore">
                🇮🇳 &nbsp; &nbsp; &nbsp;Bangalore
              </option>
              <option value="moscow">🇷🇺 &nbsp; &nbsp; &nbsp;Moscow</option>
              <option value="mumbai">🇮🇳 &nbsp; &nbsp; &nbsp;Mumbai</option>
              <option value="tokyo">🇯🇵 &nbsp; &nbsp; &nbsp;Tokyo</option>
              <option value="new-york">🇺🇸 &nbsp; &nbsp; &nbsp;New York</option>
              <option value="california">
                🇺🇸 &nbsp; &nbsp; &nbsp;California
              </option>
              <option value="singapore">
                🇸🇬&nbsp; &nbsp; &nbsp; Singapore
              </option>
              <option value="rome">🇮🇹 &nbsp; &nbsp; &nbsp;Rome</option>
              <option value="sydney">🇦🇺 &nbsp; &nbsp; &nbsp;Sydney</option>
              <option value="amsterdam">
                🇳🇱 &nbsp; &nbsp; &nbsp;Amsterdam
              </option>
            </select>
          </div>

          {/* Algorithm Selection */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Algorithm
            </h3>
            <select
              value={sideStatus_temp.algorithm || ""}
              onChange={(e) =>
                setSidestatus_temp((prev) => ({
                  ...prev,
                  algorithm: e.target.value,
                }))
              }
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white 
                         cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Select --</option>
              <option value="djikstra">🔍 &nbsp; &nbsp;Djikstra</option>
              <option value="astar">⭐ &nbsp; &nbsp;A*</option>
              <option value="greedy">🚀 &nbsp; &nbsp;Greedy</option>
              <option value="bidirectional">
                🔄 &nbsp; &nbsp;BiDirectional
              </option>
            </select>
          </div>

          {/* Radius Slider */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Area Radius
            </h3>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              defaultValue="2000"
              onChange={(e) =>
                setSidestatus_temp((prev) => ({
                  ...prev,
                  radius: e.target.value,
                }))
              }
              className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <p className="text-slate-300 text-xs mt-1">
              {(sideStatus_temp.radius || sideStatus.radius) / 1000} KM
            </p>
          </div>

          {/* Speed Slider */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">
              Animation Speed
            </h3>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              defaultValue="5"
              onChange={(e) =>
                setSidestatus_temp((prev) => ({
                  ...prev,
                  speed: e.target.value - 1,
                }))
              }
              className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <p className="text-slate-300 text-xs mt-1">
              {(sideStatus_temp.speed || 4) + 1}
            </p>
          </div>

          {/* Path Colors */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "visited", label: "Visited Path", default: "#3b82f6" },
              { key: "final_path", label: "Final Path", default: "#22c55e" },
              { key: "radius_color", label: "Radius", default: "#00FF00" },
            ].map((opt) => (
              <div key={opt.key} className="flex flex-col items-center">
                <label className="text-xs text-slate-300 my-2">
                  {opt.label}
                </label>
                <input
                  type="color"
                  value={sideStatus_temp[opt.key] || opt.default}
                  onChange={(e) =>
                    setSidestatus_temp((prev) => ({
                      ...prev,
                      [opt.key]: e.target.value,
                    }))
                  }
                  className="w-8 h-8 rounded cursor-pointer border border-slate-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 text-xs text-slate-400 border-t border-slate-700/30">
          🖱️ Left Click → <span className="text-green-400">Start Node</span> |
          Right Click → <span className="text-red-400">End Node</span>
        </div>
      </div>
    </div>
  );
}

export default ControlBar;
