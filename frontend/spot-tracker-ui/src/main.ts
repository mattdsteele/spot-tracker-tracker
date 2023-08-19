import type {
  ApiUrls,
  course,
  FenceDefinition,
  GeofenceTransition,
  Pings,
} from './types';
import type * as geojson from 'geojson';
import { GeoJSONSource, LngLatLike, Map, Popup } from 'maplibre-gl';
import haversine from 'haversine';

import { lineString, nearestPointOnLine, point as turfPoint } from '@turf/turf';
import { formatInTimeZone } from 'date-fns-tz';
import { stops } from './stops';

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const state: Partial<{
  pings: Pings;
  course: course;
  transitions: GeofenceTransition[];
  popup: Popup;
}> = {};
const zone = 'America/Chicago';

// const omaha: LngLatLike  = [-95.98, 41.27695];
const lincoln: LngLatLike = [-96.725463, 40.877181];

const defaultApiUrls: ApiUrls = {
  course:
    'https://galw5wepzdonotejavrka3zrqm0zmnwb.lambda-url.us-east-2.on.aws/',
  pings:
    'https://ewymlkyn437zs2dlpep5royeea0jjrvk.lambda-url.us-east-2.on.aws/',
  transitions:
    'https://4kwgzt2ismy4nckqqptkfrjanq0upafr.lambda-url.us-east-2.on.aws/',
  geofences:
    'https://6f7w2jqblnebkk75folo4zv7j40qvxfp.lambda-url.us-east-2.on.aws/',
};

const historicApiUrls = (courseName: string): ApiUrls => {
  return {
    course: `courses/${courseName}/course.json`,
    geofences: `courses/${courseName}/geofences.json`,
    pings: `courses/${courseName}/pings.json`,
    transitions: `courses/${courseName}/transitions.json`,
  };
};

const getEndpoints = (): ApiUrls => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('course')) {
    return historicApiUrls(params.get('course'));
  }
  return defaultApiUrls;
};
const endpoints = getEndpoints();

// and set values based on query params
const fromUrl = 'from';
const params = new URLSearchParams(window.location.search);

(async () => {
  const maplibregl = await import('maplibre-gl');
  const map = new maplibregl.Map({
    container: 'map',
    style:
      'https://api.maptiler.com/maps/basic/style.json?key=Co2mlew8NdTFIssVb1UW', // stylesheet location
    center: lincoln, // starting position [lng, lat]
    zoom: 11, // starting zoom
  });
  map.on('load', async () => {
    Promise.all([
      addPointsToMap(map),
      addFencesToMap(map),
      addCourseToMap(map),
      fetchTransitions(),
    ]).then(() => {
      console.log(state);
      captureAnalytics(map);
    });
  });

  document.querySelector('.refresh').addEventListener('click', () => {
    reloadContent(map);
  });
})();

async function reloadContent(map: Map) {
  const pings = await getPings();
  state.pings = pings;
  const geojson = pingsAsGeojson(pings);
  (map.getSource('p') as GeoJSONSource).setData(geojson);
  captureAnalytics(map);
}

async function captureAnalytics(map: Map) {
  const line = lineString(
    state.course?.route?.map(({ latitude, longitude }) => [
      longitude,
      latitude,
    ]),
  );
  const [latest] = state.pings;
  const lngLat: LngLatLike = [latest.longitude, latest.latitude];
  const point = turfPoint(lngLat);
  const snapped = nearestPointOnLine(line, point, { units: 'miles' });
  const roundedMiles = snapped.properties.location.toPrecision(4);
  const t = new Date(latest.time);
  const relativeTime = formatInTimeZone(t, zone, 'MM/dd HH:mm');
  map.panTo(lngLat);

  const [snappedLon, snappedLat] = snapped.geometry.coordinates;
  const distanceFromSnappedPoint = haversine({ longitude: latest.longitude, latitude: latest.latitude }, { longitude: snappedLon, latitude: snappedLat }, { unit: 'mile' })

  let template: string;
  if (distanceFromSnappedPoint < 1) {
    template = `
    <p>${roundedMiles} miles</p>
    <p>Posted ${relativeTime}</p>
  `;
  } else {
    template = `<p>Posted ${relativeTime}</p>`;
  }
  
  if (state.popup?.isOpen()) {
    state.popup.remove();
  }
  const popup = new Popup({ closeOnClick: false })
    .setLngLat(lngLat)
    .setHTML(template)
    .addTo(map);
  state.popup = popup;
}
async function addPointsToMap(map: Map) {
  let pings = await getPings();
  state.pings = pings;
  const geojson: GeoJSON.FeatureCollection = pingsAsGeojson(pings);
  map.addSource('p', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'points-layer',
    source: 'p',
    type: 'circle',
    paint: {
      // 'circle-radius': [ 'coalesce', ['get', 'asdf'], 10, ],
      'circle-pitch-alignment': 'map',
      'circle-color': [
        'match',
        ['get', 'latest'],
        'true',
        'green',
        'false',
        'black',
        'orange',
      ],
      'circle-radius': ['match', ['get', 'latest'], 'true', 15, 'false', 3, 1],
      'circle-opacity': [
        'match',
        ['get', 'latest'],
        'true',
        1,
        'false',
        0.5,
        0.5,
      ],
      // https://docs.mapbox.com/mapbox-gl-js/example/data-driven-circle-colors/
      // "circle-opacity": ["get", "opacity"],
    },
  });

}
async function getPings() {
  const daysToSearch = 3;
  const baseUrl = endpoints.pings;
  const spotPings = await fetch(`${baseUrl}?days=${daysToSearch}`);
  let spotPingsJson: Pings = await spotPings.json();
  let pings = spotPingsJson
    .map((r) => ({
      ...r,
      time: new Date(r.time).getTime(),
    }))
    .sort((a, b) => (a.time < b.time ? 1 : -1));

  if (params.has(fromUrl)) {
    const fromTime = parseInt(params.get(fromUrl));
    pings = pings.filter((p) => p.time < fromTime);
  }
  return pings;
}
function pingsAsGeojson(pings: Pings) {
  const now = new Date().getTime();
  const latestPing = pings[0];
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
          latest: r.time === latestPing.time ? 'true' : 'false',
        },
      };
    }),
  };
  return geojson;
}

async function addFencesToMap(map: Map) {
  const fences = await fetch(endpoints.geofences);
  const fencesJ: FenceDefinition[] = await fences.json();
  const fencesG: geojson.FeatureCollection = {
    type: 'FeatureCollection',
    features: fencesJ.map((f) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: f.geometry,
        },
        properties: {
          id: f['fence-name'],
        },
      };
    }) as any,
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

  map.on('click', 'fences-layer', (e) => {
    const { features, lngLat } = e;
    const props = features[0].properties;
    const { id } = props;
    const stop = stops.find((x) => x[0] === id);
    const fenceTransitions = state.transitions
      .filter((x) => x.geofence === id)
      .sort((a, b) => (a.eventTime < b.eventTime ? 1 : -1));
    const fenceEnter = fenceTransitions.find((x) => x.eventType === 'ENTER');
    const fenceExit = fenceTransitions.find((x) => x.eventType === 'EXIT');
    let html = `<h3>${stop[1]}</h3>
      <p>Mile: ${stop[2]}</p>`;
    if (fenceEnter) {
      html += `<p>Arrived ${formatInTimeZone(
        new Date(fenceEnter.eventTime),
        zone,
        'MM/dd HH:mm',
      )}<p>`;
    }
    if (fenceExit) {
      html += `<p>Left ${formatInTimeZone(
        new Date(fenceExit.eventTime),
        zone,
        'MM/dd HH:mm',
      )}<p>`;
    }
    new Popup().setLngLat(lngLat).setHTML(html).addTo(map);
  });
}

async function addCourseToMap(map: Map) {
  const getCourseStructureUrl = endpoints.course;
  const getCourseStructureResponse = await fetch(getCourseStructureUrl);
  const courseStructureJ: course = await getCourseStructureResponse.json();
  state.course = courseStructureJ;
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
}
async function fetchTransitions() {
  const getFenceTransitionsUrl = endpoints.transitions;
  const res = await fetch(getFenceTransitionsUrl);
  const transitions: GeofenceTransition[] = await res.json();
  state.transitions = transitions;
}
