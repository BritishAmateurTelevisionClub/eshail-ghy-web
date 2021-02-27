// Main map object
var map;
var map_loaded = false;
// Satellite Location Marker
var eshail_orbit;
var eshail_position;
var eshail_loaded = false;
var eshail_marker;
// User Location Marker
var user_marker;
var user_marker_position;
var user_view_line;
// Satellite footprint circle
var eshail_footprint;
var eshail_footprint_radius_meters;
var eshail_footprint_toggle_btn;
var eshail_footprint_enabled = true;

var wmm = new WorldMagneticModel();
var wmmDateObj = new Date();
var wmmDate = wmmDateObj.getFullYear() + ((wmmDateObj.getMonth() + 1)/12.0);  

const doha_latLng = {lat: 25.7796, lng: 51.2059, alt: 0};
const doha_zoom = 3;
const doha_zoom_latLng = {lat: 19.6585, lng: 10.2596};

// Try to load from browser storage if supported
var storageSupport = false;
var init_latLng = doha_latLng;
var init_zoom = doha_zoom;
var init_zoom_latLng = doha_zoom_latLng;
var init_type = 'roadmap';

var span_point_sk;
var span_page_status;
var span_point_az;
var span_point_el;

var span_gs_lat;
var span_gs_lng;
var span_gs_qra;

if(typeof(Storage) !== "undefined")
{
  storageSupport = true;

  if(localStorage.pointLat && localStorage.pointLng)
  {
    init_latLng = {lat: parseFloat(localStorage.pointLat), lng: parseFloat(localStorage.pointLng), alt: 0};
  }

  if(localStorage.pointZoomLat
    && localStorage.pointZoomLng)
  {
    init_zoom_latLng = {lat: parseFloat(localStorage.pointZoomLat), lng: parseFloat(localStorage.pointZoomLng)};
  }

  if(localStorage.pointZoom)
  {
    init_zoom = parseInt(localStorage.pointZoom);
  }

  if(localStorage.pointType)
  {
    init_type = localStorage.pointType;
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: init_zoom_latLng,
    zoom: init_zoom,
    streetViewControl: false,
    mapTypeId: init_type
  });

  if(storageSupport)
  {
    map.addListener('center_changed', function()
    {
      localStorage.pointZoomLat = map.getCenter().lat();
      localStorage.pointZoomLng = map.getCenter().lng();
    });

    map.addListener('zoom_changed', function()
    {
      localStorage.pointZoom = map.getZoom();
    });

    map.addListener('maptypeid_changed', function()
    {
      localStorage.pointType = map.getMapTypeId();
    });

    eshail_footprint_toggle_btn = document.createElement("button");
    eshail_footprint_toggle_btn.textContent = "Toggle Visibility Circle";
    eshail_footprint_toggle_btn.classList.add("custom-map-control-button");

    eshail_footprint_toggle_btn.addEventListener("click", () => {
      if(eshail_footprint_enabled)
      {
        eshail_footprint.setMap(null);
        eshail_footprint_enabled = false;
      }
      else
      {
        eshail_footprint.setMap(map);
        eshail_footprint_enabled = true;
      }
    });
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(eshail_footprint_toggle_btn);
  }

  user_marker = new google.maps.Marker({
    position: init_latLng,
    draggable: true,
    map: map
  });
  user_marker_position = init_latLng;

  google.maps.event.addListener(map, 'click', function(event)
  {
    user_marker.setPosition(event.latLng);
    user_marker_position = {lat: event.latLng.lat(), lng: event.latLng.lng(), alt: 0};
    updateGroundStation();
    updatePointing();
  });

  user_marker.addListener('drag', function(event)
  {
    user_marker.setPosition(event.latLng);
    user_marker_position = {lat: event.latLng.lat(), lng: event.latLng.lng(), alt: 0};
    updateGroundStation();
    updatePointing();
  });

  user_marker.addListener('dragend', function(event)
  {
    user_marker.setPosition(event.latLng);
    user_marker_position = {lat: event.latLng.lat(), lng: event.latLng.lng(), alt: 0};
    updateGroundStation();
    updatePointing();
  });

  if(eshail_loaded)
  {
    updateGroundStation(init_latLng);
    renderSatellite();
    renderFootprint();
    updatePointing();
  }
  else
  {
    map_loaded = true;
  }
}

function updateGroundStation()
{
  span_gs_lat.text((Math.round(user_marker_position.lat*10000)/10000).toFixed(4)+"°");
  span_gs_lng.text((Math.round(user_marker_position.lng*10000)/10000).toFixed(4)+"°");
  span_gs_qra.text(CoordToLoc(user_marker_position.lat, user_marker_position.lng));
}

var point_elevation = 0;
var el_occluded = false;
function updatePointing()
{
  if(user_view_line == null)
  {
    user_view_line = new google.maps.Polyline({
      map: map,
      path: [
        user_marker_position,
        eshail_position
      ],
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
  }
  else
  {
    user_view_line.setPath([
      user_marker_position,
      eshail_position
    ]);
  }

  const mag_dev = wmm.declination(0, user_marker_position.lat, user_marker_position.lng, wmmDate);
  const point_azimuth = relativeAzimuth(
    [user_marker_position.lat, user_marker_position.lng], user_marker_position.alt,
    [eshail_position.lat, eshail_position.lng], eshail_position.alt
  );
  point_elevation = relativeElevation(
    [user_marker_position.lat, user_marker_position.lng], user_marker_position.alt,
    [eshail_position.lat, eshail_position.lng], eshail_position.alt
  );
  span_point_az.text((Math.round(point_azimuth*10)/10).toFixed(1)+"°"
    +" ("+(Math.round((point_azimuth-mag_dev)*10)/10).toFixed(1)+"° magnetic)"
  );
  span_point_el.text((Math.round(point_elevation*10)/10).toFixed(1)+"°"
  );
  console.log("Az: "+(point_azimuth)+", El: "+(point_elevation));

  var _lnb_skew = (Math.round(skew(user_marker_position, eshail_position.lng)*10)/10).toFixed(1);
  span_point_sk.text((_lnb_skew < 0 ? "" : "+")+_lnb_skew+"°");

  // Set elevation text colour
  if(el_occluded && point_elevation >= 0.0)
  {
    span_point_el.removeClass("el-occluded");
    el_occluded = false;
  }
  else if(!el_occluded && point_elevation < 0.0)
  {
    span_point_el.addClass("el-occluded");
    el_occluded = true;
  }

  // Save updated user position to browser storage
  if(storageSupport)
  {
    localStorage.pointLat = user_marker_position.lat;
    localStorage.pointLng = user_marker_position.lng;
  }
}

function renderSatellite()
{
  eshail_marker = new google.maps.Marker({
    icon: {
      url: '/img/satellite.png',
      scaledSize: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(16, 16)
    },
    position: eshail_position,
    map: map
  });
}

function renderFootprint()
{
  const earth_radius_meters = 6.378135e6; // Earth radius, m
  eshail_footprint_radius_meters = earth_radius_meters * Math.acos(earth_radius_meters / (earth_radius_meters + eshail_position.alt));

  eshail_footprint = new google.maps.Circle({
    center: eshail_position,
    radius: eshail_footprint_radius_meters,
    strokeColor: "#0000F0",
    strokeOpacity: 0.4,
    strokeWeight: 1,
    fillOpacity: 0.0,
    map: map,
  });
}

function loadTLE()
{
  $.ajax({
    url:      "/eshail.txt",
    type:     'GET',
    cache:    false
  }).done(function(data, status, xhr)
  {
    var stations = orbits.util.parseTLE(data);
    for(var i = 0; i < stations.length; i++)
    {
      if(stations[i].name == "0 ES'HAIL 2")
      {
        var satOpts = {
          tle: stations[i],
          pathLength: 1,
        };
        
        eshail_orbit = new orbits.Satellite(satOpts);  
        eshail_orbit.refresh();
        eshail_position = {
          lat: eshail_orbit.orbit.getPosition()[0],
          lng: eshail_orbit.orbit.getPosition()[1],
          alt: eshail_orbit.orbit.getAltitude()*1000 // meters
        };
        
        var today = new Date();
        var today_days_since_0 = (today.getFullYear() * 365) + ((today - (new Date(today.getFullYear(), 0, 0)))/(1000*60*60*24));
        var tle_days_since_0 = (eshail_orbit.tle.epoch_year * 365) + eshail_orbit.tle.epoch_day;
        console.log("TLE Age: "+(today_days_since_0-tle_days_since_0)+" days.");

        if(today_days_since_0 - tle_days_since_0 < 7)
        {
          span_page_status.text("Ready (loaded TLE: "+eshail_orbit.tle.epoch_year+"."+Math.floor(eshail_orbit.tle.epoch_day)+")");
        }
        else
        {
          span_page_status.text("WARNING: TLE out of date (loaded TLE: "+eshail_orbit.tle.epoch_year+"."+Math.floor(eshail_orbit.tle.epoch_day)+")");
        }

        if(map_loaded)
        {
          updateGroundStation(init_latLng);
          renderSatellite();
          renderFootprint();
          updatePointing();
        }
        else
        {
          eshail_loaded = true;
        }
      }
    }
  }).fail(function(error)
  {
    $("#textarea-tle").val("Error loading TLE from server.");
    console.log("TLE Error", error);
    loadTLE();
  });
}

function skew(gs_latLng, sat_lng)
{
  return -57.29578 * Math.atan((Math.sin((sat_lng - gs_latLng.lng) / 57.29578)) / Math.tan(gs_latLng.lat / 57.29578));
}

function copysign( x, y )
{
  if(y > 0)
  {
    return x;
  }
  else
  {
    return -1.0*x;
  }
}

function quaternion_to_euler(q)
{
  // roll (x-axis rotation)
  sinr_cosp = +2.0 * (q[0] * q[1] + q[2] * q[3]);
  cosr_cosp = +1.0 - 2.0 * (q[1] * q[1] + q[2] * q[2]);
  roll = Math.atan2(sinr_cosp, cosr_cosp);

  // pitch (y-axis rotation)
  sinp = +2.0 * (q[0] * q[2] - q[3] * q[1]);
  if (Math.abs(sinp) >= 1)
    pitch = copysign(Math.PI / 2, sinp); // use 90 degrees if out of range
  else
    pitch = Math.asin(sinp);

  // yaw (z-axis rotation)
  siny_cosp = +2.0 * (q[0] * q[3] + q[1] * q[2]);
  cosy_cosp = +1.0 - 2.0 * (q[2] * q[2] + q[3] * q[3]);  
  yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [roll*(180/Math.PI), pitch*(180/Math.PI), yaw*(180/Math.PI)];
}

$(function()
{
  span_point_sk = $("#point-skew");
  span_page_status = $("#page-status");
  span_point_az = $("#point-az");
  span_point_el = $("#point-el");

  span_gs_lat = $("#gs-lat");
  span_gs_lng = $("#gs-lon");
  span_gs_qra = $("#gs-qra");

  loadTLE();

  $("#device-location-link").click(function(event)
  {
    event.preventDefault();
    navigator.geolocation.getCurrentPosition(function(position)
      {
        user_marker_position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          alt: position.coords.altitude
        };
        user_marker.setPosition(user_marker_position);
        updateGroundStation();
        updatePointing();
        map.setCenter(user_marker_position);
        map.setZoom(18);
      },
      function(err)
      {
        if(err.message == "")
        {
          alert("Device Error: Location unavailable.");
        }
        else
        {
          alert("Device Error: "+err.message);
        }
        //console.log(err);
      }
    );

  });

  $("#device-location").show();
  
  var span_point_el_offset = $("#point-el-offset");
  const sensorAbs = new AbsoluteOrientationSensor();
  sensorAbs.onactivate = function()
  {
    $("#point-el-offset-li").show();
  };
  sensorAbs.onreading = function()
  {
    //console.log(sensorAbs);
    var el_offset = (180-quaternion_to_euler(sensorAbs.quaternion)[2]) - point_elevation;
    if(el_offset > 180)
    {
      el_offset = el_offset - 360;
    }
    var sign_char = "";
    if(el_offset >= 0)
    {
      sign_char = "+";
    }
    span_point_el_offset.text(sign_char+(Math.round(el_offset*10)/10).toFixed(1)+"°");
  };

  const n = navigator.userAgent.toLowerCase();

  if(navigator.geolocation
    && (n.indexOf('iphone')!=-1
      || n.indexOf('ipod')!=-1
      || n.indexOf('ios')!=-1
      || n.indexOf('android')!=-1
    )
  )
  {  
    Promise.all([navigator.permissions.query({ name: "accelerometer" }),
             navigator.permissions.query({ name: "magnetometer" }),
             navigator.permissions.query({ name: "gyroscope" })])
      .then(results => {
         if (results.every(result => result.state === "granted")) {
           sensorAbs.start();
         } else {
           console.log("No permissions to use AbsoluteOrientationSensor.");
         }
    });
  }
});

const ping_interval = 10*1000;
function ping() {
  var request = new XMLHttpRequest();
  request.open('GET', 'https://eshail.batc.org.uk/a.gif', true);
  request.send();
  request = null;
  setTimeout(ping, ping_interval);
}
setTimeout(ping, ping_interval);
