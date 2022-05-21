import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import maplibregl, { Map } from 'maplibre-gl';
import type * as geojson from 'geojson';
import { center } from '@turf/turf';

const map = new maplibregl.Map({
  container: 'map',
  style:
    'https://api.maptiler.com/maps/streets/style.json?key=Co2mlew8NdTFIssVb1UW', // stylesheet location
  center: [-95.98, 41.27695], // starting position [lng, lat]
  zoom: 11, // starting zoom
});

map.on('load', async () => {
  addPointsToMap(map);
  addFencesToMap(map);
  addCourseToMap(map);
});
async function addPointsToMap(map: Map) {
  type Pings = Ping[];
  type Ping = {
    latitude: number;
    longitude: number;
    time: string;
  };
  const spotPings = await fetch(
    'https://ewymlkyn437zs2dlpep5royeea0jjrvk.lambda-url.us-east-2.on.aws/'
  );
  let spotPingsJson: Pings = await spotPings.json();
  const pings = spotPingsJson
    .map((r) => ({
      ...r,
      time: new Date(r.time).getTime(),
    }))
    .sort((a, b) => (a.time < b.time ? 1 : -1));
  const now = new Date().getTime();
  const latestPing = pings[pings.length - 1];
  const earliest = latestPing?.time;
  const mapValues = (
    x: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number
  ) => ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: pings.map((r) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [r.longitude, r.latitude],
        },
        properties: {
          opacity: mapValues(r.time, earliest, now, 0.1, 1),
        },
      };
    }),
  };
  map.addSource('p', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'points-layer',
    source: 'p',
    type: 'circle',
    paint: {
      // 'circle-radius': [ 'coalesce', ['get', 'asdf'], 10, ],
      'circle-pitch-alignment': 'map',
      // https://docs.mapbox.com/mapbox-gl-js/example/data-driven-circle-colors/
      // "circle-opacity": ["get", "opacity"],
    },
  });
}

async function addFencesToMap(map: Map) {
  type FenceDefinition = {
    'fence-name': string,
    geometry: [number, number]
  }
  const fences = await fetch(
    'https://6f7w2jqblnebkk75folo4zv7j40qvxfp.lambda-url.us-east-2.on.aws/'
  );
  const fencesJ: FenceDefinition[] = await fences.json();
  const fencesG = {
    type: 'FeatureCollection',
    features: fencesJ.map((f) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: f.geometry,
        },
      };
    }),
  };

  map.addSource('f', { type: 'geojson', data: fencesG });
  map.addLayer({
    id: 'fences-layer',
    source: 'f',
    type: 'fill',
    paint: {
      'fill-color': '#088',
      'fill-opacity': 0.7,
    },
  });
}

async function addCourseToMap(map: Map) {
  const getCourseStructureUrl =
    'https://galw5wepzdonotejavrka3zrqm0zmnwb.lambda-url.us-east-2.on.aws/';
  const getCourseStructureResponse = await fetch(getCourseStructureUrl);
  type course = {
    name: string;
    route: point[];
    pointsOfInterest: pointsOfInterest[];
  };
  type point = {
    latitude: number;
    longitude: number;
  };
  type pointsOfInterest = {
    latitude: number;
    longitude: number;
    name: string;
  };
  const courseStructureJ: course = await getCourseStructureResponse.json();
  const courseGeojson: geojson.GeoJSON = {
    type: 'LineString',
    coordinates: courseStructureJ.route.map((c) => {
      return [c.longitude, c.latitude];
    }),
  };
  map.addSource('course', { type: 'geojson', data: courseGeojson });
  map.addLayer({
    id: 'course-layer',
    source: 'course',
    type: 'line',
  });
  const newCenter = center(courseGeojson);
  const newCenterCoords = newCenter.geometry.coordinates;
  map.setCenter(newCenterCoords as any)
}

