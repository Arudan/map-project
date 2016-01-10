// An helper function to handle string capitalization
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

// ===========================
//          SETTINGS
// ===========================

// API settings
var api = {
  fourSquare: {
    url: 'https://api.foursquare.com/v2/venues/explore',
    data: {
      client_id: 'Q3JPRLMS5E2VEMJIMHFYQ2M2MR2PUZGLBCAZXRCFO3AXYF4W',
      client_secret: 'VHO1ZTEUM5LZAC3FGWIISGYDWT0PKHGIQOLY4W40P5SADAAJ',
      ll: '45.466342, 9.188288',
      limit: '100',
      radius: '3000',
      v: '20160106',
      m: 'foursquare',
      section: ''
    }
  },
  panoramio: {
    url: 'http://www.panoramio.com/map/get_panoramas.php',
    data: {
      set: 'public',
      from: 0,
      to: 1,
      size: 'small',
      mapfilter: true,
    }
  },
  openWeatherMap: {
    url: 'http://api.openweathermap.org/data/2.5/weather',
    data: {
      appid: 'a2cece10a398e7a25c1aafe086efa12a'
    }
  }
};

// Place general settings
var settings = {
  monument: {
    icon: '<i class="fa fa-fw fa-university"></i>',
    markerIcon: {
      path: fontawesome.markers.UNIVERSITY,
      scale: 0.4,
      strokeWeight: 0.3,
      strokeColor: '#000000',
      strokeOpacity: 1,
      fillOpacity: 1,
      fillColor: '#cdb946'
    }
  },
  restaurant: {
    icon: '<i class="fa fa-fw fa-cutlery"></i>',
    markerIcon: {
      path: fontawesome.markers.CUTLERY,
      scale: 0.4,
      strokeWeight: 0.3,
      strokeColor: '#000000',
      strokeOpacity: 1,
      fillOpacity: 1,
      fillColor: '#f05858'
    }
  },
  nightlife: {
    icon: '<i class="fa fa-fw fa-glass"></i>',
    markerIcon: {
      path: fontawesome.markers.GLASS,
      scale: 0.4,
      strokeWeight: 0.3,
      strokeColor: '#000000',
      strokeOpacity: 1,
      fillOpacity: 1,
      fillColor: '#64b3e1'
    }
  }
};

// ===========================
//           PLACE
// ===========================

// Util to create infowindow text
var getInfoText = function(place) {
  var infoText = '<div class="infotext">' +
  '<h4>' + place.icon +' '+ place.type.capitalize() + '</h4>' +
  '<h3>'+ place.name +'</h3>' +
  '<h5>' + place.address + '</h5>' +
  '<h6>' + place.location() + '</h6>';

  if (place.weather){
    infoText += '<h5>Weather:'+
    '<img class="weather" src="http://openweathermap.org/img/w/'+
    place.weather.icon +'.png"></h5>';
  }

  if (place.img){
    infoText += '<img src="' + place.img +'">';
  }
  infoText += '</div>';
  return infoText;
};

// PLACE CLASS
var Place = function(data, type){
  var self = this;

  // properties of the Place object
  self.name = data.name;
  self.type = type;
  self.lat = data.location.lat;
  self.lng = data.location.lng;
  self.address = data.location.address;
  self.location = ko.computed(function() {
        return self.lat + ", " + self.lng;
    }, self);

  // gets the icon from the settings object
  self.icon = settings[self.type].icon;

  // Creates the marker
  self.marker = new google.maps.Marker({
    position: {lat: data.location.lat, lng: data.location.lng},
    title: self.name,
    icon: settings[self.type].markerIcon
  });

  // sets the ko observable var rappresenting Place's visibility
  self.isVisible = ko.observable(false);

  // On change on isVisible, the marker visibility on map is toggled
  self.isVisible.subscribe(function(visibility) {
    if (visibility) {
      self.marker.setMap(map);
    } else {
      self.marker.setMap(null);
    }
  });

  // Sets the marker as visible on creation
  self.isVisible(true);

  // is the infowindow active?
  self.active = ko.observable(false);

  // on active observable change, open/close infowindow
  self.active.subscribe(function(status) {
    if (status) {
      self.infoWindowOpen();
    } else {
      self.infoWindow.close();
    }
    mapViewModel.sortPlaceListByName();
  });

  // adds a 'click' event listener on the marker
  self.marker.addListener('click', function() {
    self.infoWindowToggle();
  });

  // toggling of active observable
  self.infoWindowToggle = function() {
    self.active(!self.active());
  };

  self.infoWindowOpen = function() {
    // If infoWindow doesn't exist, creates it
    if (!self.infoWindow) {
      // gets the text
      self.infoText = getInfoText(self);
      // creates infowindow
      self.infoWindow = new google.maps.InfoWindow({
        content: self.infoText
      });
      // adds a listener for the closeclick
      self.infoWindow.addListener('closeclick',function(){
        // on closeclick sets active observable to false
        self.active(false);
      });
    } else {
      // if the infowindow already exist, refresh text
      self.infoWindow.setContent(self.infoText);
    }

    // opens infowindow
    self.infoWindow.open(map, self.marker);

    map.setCenter(self.marker.getPosition());
    // marker bounces on opening
    self.marker.setAnimation(google.maps.Animation.BOUNCE);
    // reset animation after 500 ms
    setTimeout(function(){
      self.marker.setAnimation(null);
    }, 500);

    // OpenWeatherMap API ajax call

    // call only if it hasn't returned a result before
    if (!self.weather){
      // gets general setting from api object
      this.openWeatherMap = api.openWeatherMap;
      // sets place specific data
      this.openWeatherMap.data.lat = self.lat;
      this.openWeatherMap.data.lon = self.lng;
      // sets success function
      this.openWeatherMap.success = function(data){
        if (data.weather[0]){
          self.weather = data.weather[0];
          self.infoText = getInfoText(self);
          self.infoWindow.setContent(self.infoText);
        }
      };
      $.ajax(this.openWeatherMap);
    }

    // Panoramio API ajax call

    // call only if it hasn't returned a result before
    if (!self.img){
      // gets general setting from api object
      this.panoramio = api.panoramio;
      // sets place specific data
      this.panoramio.dataType = "jsonp";
      this.panoramio.data.miny = self.lat - 0.001;
      this.panoramio.data.minx = self.lng - 0.001;
      this.panoramio.data.maxy = self.lat + 0.001;
      this.panoramio.data.maxx = self.lng + 0.001;
      // sets success function
      this.panoramio.success = function(data){
        if (data.photos[0]){
          self.img = data.photos[0].photo_file_url;
          self.infoText = getInfoText(self);
          self.infoWindow.setContent(self.infoText);
        }
      };
      $.ajax(this.panoramio);
    }

  };
};

// ===========================
//        VIEW MODEL
// ===========================
var ViewModel = function () {
  var self = this;

  // toggle menu visibility
  self.showMenu = ko.observable(false);
  self.toggleMenu = function () {
    self.showMenu( !self.showMenu() );
  };

  // List of places
  self.placeList = ko.observableArray([]);

  self.sortPlaceListByName = function(){
    self.placeList.sort(function (left, right) {
      if (left.active() === right.active()){
        return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1);
      } else {
        return left.active() < right.active() ? 1 : -1;
      }
    });
  };

  // observables for filter
  self.currentFilter = ko.observable('');
  self.monumentsFilter = ko.observable(true);
  self.restaurantFilter = ko.observable(true);
  self.nightlifeFilter = ko.observable(true);

  // functions to toggle the typologies filters
  self.toggleMonuments = function () {
    self.monumentsFilter( !self.monumentsFilter() );
  };
  self.toggleRestaurant = function () {
    self.restaurantFilter( !self.restaurantFilter() );
  };
  self.toggleNightlife = function () {
    self.nightlifeFilter( !self.nightlifeFilter() );
  };

  // function to filter place by text input
  self.filterPlaces = ko.computed(function () {
    var search  = self.currentFilter().toLowerCase();

    // sets visibility of places based on the filter
    return ko.utils.arrayFilter(self.placeList(), function(place) {
        var match = true;
        // first checks the place against type filters
        if (place.type === 'monument') {
          match = self.monumentsFilter();
        }
        if (place.type === 'restaurant') {
          match = self.restaurantFilter();
        }
        if (place.type === 'nightlife') {
          match = self.nightlifeFilter();
        }
        // if match is still true, checks against search string
        if (match) {
          match = place.name.toLowerCase().indexOf(search) >= 0;
        }
        place.isVisible(match);
        return match;
    });
  });
};

// MAP INIT
var map, mapViewModel;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 45.466342,
      lng: 9.188288
    },
    zoom: 14,
    disableDefaultUI: true
  });
  mapViewModel = new ViewModel();
  ko.applyBindings(mapViewModel);

  var sections = [
    {section: 'arts', callback: 'callbackMonuments'},
    {section: 'food', callback: 'callbackRestaurants'},
    {section: 'drinks', callback: 'callbackNightlife'}
  ];

  var fourSquareData = api.fourSquare.data;

  sections.forEach(function(item){
    fourSquareData.section = item.section;

    $.ajax({
      dataType: "json",
      url: api.fourSquare.url,
      data: fourSquareData,
      success: window[item.callback]
    });
  });
}

var baseCallback = function(data, type) {
  data.response.groups[0].items.forEach(function(item){
    mapViewModel.placeList.push(new Place(item.venue, type));
  });
  mapViewModel.sortPlaceListByName();
};

var callbackMonuments = function(data) {
  baseCallback(data, 'monument');
};

var callbackRestaurants = function(data) {
  baseCallback(data, 'restaurant');
};

var callbackNightlife = function(data) {
  baseCallback(data, 'nightlife');
};
