import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css'
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets/style.json?key=Co2mlew8NdTFIssVb1UW', // stylesheet location
    center: [-95.98, 41.27695], // starting position [lng, lat]
    zoom: 11 // starting zoom
});
map.on('load', async () => {
    const res = await fetch('https://ewymlkyn437zs2dlpep5royeea0jjrvk.lambda-url.us-east-2.on.aws/')
    let resJ = await res.json();
    resJ = resJ.map(r => ({
        ...r,
        time: new Date(r.Time).getTime()
    })).sort((a, b) => a.time < b.time ? 1 : -1);
    const now = new Date().getTime();
    const earliest =  resJ[resJ.length - 1].time;
    const mapValues = (x, in_min, in_max, out_min, out_max) => (
        (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
    )
    console.log(resJ)
    const geojson = {
            type: 'FeatureCollection',
            features: resJ.map(r => {
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [r.longitude, r.latitude]
                    },
                    properties: {
                        opacity: mapValues(r.time, earliest, now, 0.1, 1)
                    }
                }
            }),
    }
    console.log(geojson)
    map.addSource('p', { type: 'geojson', data: geojson })
    console.log(map.isSourceLoaded('p'))
    console.log(map.getSource('p'))
    map.addLayer({
        id: 'points-layer',
        source: 'p',
        type: 'circle',
        paint: {
            // 'circle-radius': [ 'coalesce', ['get', 'asdf'], 10, ],
            'circle-pitch-alignment': 'map',
            // https://docs.mapbox.com/mapbox-gl-js/example/data-driven-circle-colors/
            'circle-opacity': ['get', 'opacity']

        }
    })
    const fences = await fetch('https://6f7w2jqblnebkk75folo4zv7j40qvxfp.lambda-url.us-east-2.on.aws/')
    const fencesJ = await fences.json();
    const fencesG = {
        type: 'FeatureCollection',
        features: fencesJ.map(f => {
            return {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: f.geometry
                }
            }
        })
    }
    map.addSource('f', { type: 'geojson', data: fencesG })
    map.addLayer({
        id: 'fences-layer',
        source: 'f',
        type: 'fill',
        paint: {
            'fill-color': '#088',
            'fill-opacity': 0.7

        }
    })
})