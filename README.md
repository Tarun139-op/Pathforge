<---------------------------------------------------Pathforge-------------------------------------------------->

Real-World Map Pathfinder in React + Mapbox

Pathforge finds the best path between two points on actual city maps, using real streets, highways, and live Mapbox data. No fake grids or maze BS—this is legit real-world navigation. Pick start and end locations with 1 click, see the fastest route animated step-by-step, tweak algorithm details, see visited nodes, and tune the map like a pro. Useful for geeks, devs, and anyone who wants to see pathfinding work for actual cities.

https://github.com/user-attachments/assets/67bac96b-b542-4a4c-8119-98cbca236b7a

<---------------------------------------------------------Features--------------------------------------------------------->

Real map navigation: Not toy mazes, this is live streets from Open Street Map.

Visual path animation: See steps taken, visited streets, and final path—animated in real time.

Algorithm switching: Comes with Dijkstra’s out of the box, easily extensible.

Map theme controls: Light, dark, outdoors, and other Mapbox styles.

Radius and speed customization: Set how far/fast the finder works.

Error handling: Tells you straight up if the map's loading, there's no street nearby, or your clicks are dumb.

Intuitive controls: Left click = start, right click = end. Easy.

<---------------------------------------------------------Tech Stack--------------------------------------------------------->

Library Usage

React ---------------> UI rendering/reactivity

Mapbox GL ---------------> Interactive real city maps

Turf.js ---------------> Road/path calculations

Overpass API ---------------> Fetching live OSM data

<---------------------------------------------------------How It Works--------------------------------------------------------->

Pick a city from control bar(Setting Icon) [New Delhi, London, Bangalore, etc.].

Left-click on map for start point (nearest road/highway gets marked).

Right-click for your destination inside the selected radius.

Watch animated pathfinding bring real shortest paths to life.

Tweak theme, radius, speed, or algorithm in controls for fun/hacks.

<---------------------------------------------------------Setup & Installation--------------------------------------------------------->

You gotta have:

Node.js (v16+ recommended)

A Mapbox API token

Install dependencies:

        npm install

Add your Mapbox token:

        Copy .env.example to .env and fill in VITE_MAPBOX_TOKEN=YOUR_TOKEN_HERE

Start dev server:

        npm run dev


<---------------------------------------------------------Gotchas--------------------------------------------------------->

If you click off-road, you'll get warned—zoom in and click closer to an actual street.

Sometimes OSM data / Overpass is slow AF, especially for big radii.

If you want new algorithms, edit worker-utils.js and load similar to Dijkstra.

<---------------------------------------------------------Contributing--------------------------------------------------------->

Fork the repo, make your edits, and open a pull request. Code should stay chill, readable, and not break legit city navigation.

Open issues for bugs, feature requests, or whatever.

License
MIT. Do what you want, no hand-holding.

<---------------------------------------------------------Credits--------------------------------------------------------->

Built by Tarun139-op

OSM streets, Mapbox maps, Open Source
