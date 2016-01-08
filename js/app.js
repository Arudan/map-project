// An helper function to handle string capitalize
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
  streetview: {
    url: 'https://maps.googleapis.com/maps/api/streetview',
    data: {
      size: '600x300',
      location: '46.414382,10.013988',
      heading: '151.78',
      pitch: '-0.76',
      key: 'AIzaSyDeqVfiJlFl0hvpayE9E8soja7pqyl7I8M'
    }
  },
  panoramio: {
    url: 'http://www.panoramio.com/map/get_panoramas.php',
    data: {
      set: 'public',
      from: 0,
      to: 1,
      minx: -180,
      miny: -90,
      maxx: -180,
      maxy: -90,
      size: 'small',
      mapfilter: true,
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
      strokeWeight: 0.2,
      strokeColor: '#000000',
      strokeOpacity: 1,
      fillOpacity: 1,
      fillColor: '#30CD2D'
    }
  },
  restaurant: {
    icon: '<i class="fa fa-fw fa-cutlery"></i>',
    markerIcon: {
      path: fontawesome.markers.CUTLERY,
      scale: 0.4,
      strokeWeight: 0.2,
      strokeColor: '#000000',
      strokeOpacity: 1,
      fillOpacity: 1,
      fillColor: '#eb2b2b'
    }
  },
  nightlife: {
    icon: '<i class="fa fa-fw fa-glass"></i>',
    markerIcon: {
      path: fontawesome.markers.GLASS,
      scale: 0.4,
      strokeWeight: 0.2,
      strokeColor: '#000000',
      strokeOpacity: 1,
      fillOpacity: 1,
      fillColor: '#6375F0'
    }
  }
};

// ===========================
//           PLACE
// ===========================

// UTILS
var getInfoText = function(place) {
  var infoText = '<h2>' + place.name + '</h2>' +
  '<h4>' + place.icon +' '+ place.type.capitalize() + '</h4>' +
  '<h5>' + place.location() + '</h5>';

  if (place.img){
    var imgTxt = '<img src="' + place.img +'">';
    infoText += imgTxt;
  }
  return infoText;
};

// PLACE CLASS
var Place = function(data, type){
  var self = this;

  // save the FourSquare api result
  self.FourSquare = data;
  // observable to contain the streetView image url

  // properties of the Place object
  self.name = data.name;
  self.type = type;
  self.lat = data.location.lat;
  self.lng = data.location.lng;

  self.location = ko.computed(function() {
        return self.lat + ", " + self.lng;
    }, self);

  self.img = '';

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

  self.active = ko.observable(false);

  self.active.subscribe(function(status) {
    if (status) {
      self.infoWindowOpen();
    } else {
      self.infoWindow.close();
    }
  });

  // adds a 'click' event listener on the marker
  self.marker.addListener('click', function() {
    self.infoWindowToggle();
  });

  self.infoWindowToggle = function() {
    self.active(!self.active());
  };

  self.infoWindowOpen = function() {
    if (!self.infoWindow) {
      self.infoText = getInfoText(self);
      self.infoWindow = new google.maps.InfoWindow({
        content: self.infoText
      });
    } else {
      self.infoWindow.setContent(self.infoText);
    }

    self.infoWindow.open(map, self.marker);
    self.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      self.marker.setAnimation(null);
    }, 500);

    if (!self.img){
      this.api = api.panoramio;
      this.api.dataType = "jsonp";
      this.api.data.miny = self.lat - 0.001;
      this.api.data.minx = self.lng - 0.001;
      this.api.data.maxy = self.lat + 0.001;
      this.api.data.maxx = self.lng + 0.001;
      this.api.success = function(data){
        if (data.photos[0]){
          self.img = data.photos[0].photo_file_url;
          self.infoText = getInfoText(self);
          self.infoWindow.setContent(self.infoText);
        }
      };
      $.ajax(this.api);
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
      return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1);
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
