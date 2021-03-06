export const mapDisplay = async (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaHRvb25hdW5nIiwiYSI6ImNsNDY3YTZ0bDA1cHYzcG5xaHY0bjhteHkifQ.CDgZ53H3PmoYpsla0gFZeg';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/htoonaung/cl467pqys000d14pkjoxewlgh', // style URL
    center: [94.243033, 20.857794], // starting position [lng, lat]
    zoom: 8, // starting zoom
    scrollZoom: true, // false
    minZoom: 5, // maximum zoom
  });

  const bounds = new mapboxgl.LngLatBounds();
  // const maxbounds = [
  //   [83.670894, 6.103465], // [west, south] 6.103465, 83.670894
  //   [107.924574, 31.216653], // [east, north] 31.216653, 107.924574
  // ];
  // map.setMaxBounds(maxbounds);
  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });
  map.on('wheel', (event) => {
    if (event.originalEvent.ctrlKey) {
      return;
    }

    if (event.originalEvent.metaKey) {
      return;
    }

    if (event.originalEvent.altKey) {
      return;
    }

    event.preventDefault();
  });

  map.fitBounds(bounds, {
    //padding: { top: 300, buttons: 300, left: 300, right: 300 },
    padding: 200,
  });
};
