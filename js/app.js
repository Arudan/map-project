// API settings
var api = {
  googlePlaces: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=45.466342,9.188288&types=establishment&radius=5000&key=AIzaSyDeqVfiJlFl0hvpayE9E8soja7pqyl7I8M&jsonp=callbackMethod',
  flickr: '9f5d59e988bb37b823cc10a4302a4b43',
};

// An helper function to handle string capitalize
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

// knockout

// model
var jsonResult = ko.observableArray([]);

var initialPlaces = [
  {
    name: 'Bento',
    type: 'restaurant',
    position: {lat: 45.466342, lng: 9.188288},
  },
  {
    name: 'MoM',
    type: 'nightlife',
    position: {lat: 45.44, lng: 9.188288},
  },
  {
    name: 'Ciao',
    type: 'monument',
    position: {lat: 45.47, lng: 9.188288},
  }
];

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
      fillColor: '#177515'
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
      fillColor: '#177515'
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
      fillColor: '#177515'
    }
  }
};

var createInfoText = function(place) {
  return "<h2>"+ place.name +"</h2>" +
  "<h4>"+ place.icon +' '+ place.type.capitalize() + "</h4>";
};

var Place = function(data){
  var self = this;

  // properties of the Place object
  self.name = data.name;
  self.type = data.type;

  // gets the icon from the settings object
  self.icon = settings[self.type].icon;

  // Creates the marker
  self.marker = new google.maps.Marker({
    position: data.position,
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

  // adds a 'click' event listener on the marker
  self.marker.addListener('click', function() {
    self.infoWindowOpen();
  });

  self.infoWindowOpen = function(place) {
    if (!self.infowindow) {
      self.infoText = createInfoText(self);

      self.infowindow = new google.maps.InfoWindow({
        content: self.infoText
      });
    }
    self.infowindow.open(map, self.marker);
    self.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ self.marker.setAnimation(null); }, 500);
  };
};

// *********
// viewmodel
// *********
var ViewModel = function () {
  var self = this;

  // List of places
  self.placeList = ko.observableArray([]);

  // Gets the places data from the custom api and for each instanciate a Place
  // object
  /*initialPlaces.forEach(function(placeItem) {
    self.placeList.push(new Place(placeItem));
  });*/

  jsonResult.subscribe(function() {
    jsonResult.forEach(function(placeItem) {
      self.placeList.push(new Place(placeItem));
    });
  });

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
var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 45.466342,
      lng: 9.188288
    },
    zoom: 13,
    disableDefaultUI: true
  });
  ko.applyBindings(new ViewModel());

  service = new google.maps.places.PlacesService(map);

  var types = [
    ['callbackMonument', ['church', 'museum', 'library', 'park']],
    ['callbackRestaurant', ['restaurant']],
    ['callbackNightlife', ['bar']]
  ];

  var request = {
    location: new google.maps.LatLng(45.466342,9.188288),
    radius: '5000',
  };

  types.forEach(function(type){
    request.types = type[1];
    service.nearbySearch(request, window[type[0]]);
  });

}

var callbackMonument = function(results){
  results.forEach(function(result) {
    result.type = 'monument';
  });
  console.log(results);
  jsonResult.push(results);
};

var callbackRestaurant = function(results){
  results.forEach(function(result, index) {
    result.type = 'restaurant';
  });
  console.log(results);
  jsonResult.push(results);
};

var callbackNightlife = function(results){
  results.forEach(function(result, index) {
    result.type = 'nightlife';
  });
  console.log(results);
  jsonResult.push(results);
};
