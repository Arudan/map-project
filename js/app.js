// An helper function to handle string capitalize
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

// knockout

// models
var initialPlaces = [
  // Schema for places
  // {
  //   name: ,
  //   type: ,
  //   position: {lat: 45.466342, lng: 9.188288},
  // }
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

var Place = function(data){
  var self = this;

  // properties of the Place object
  self.name = data.name;
  self.type = data.type;
  self.position = data.position;

  // gets the icon from the settings object
  self.icon = settings[self.type].icon;

  // Creates the marker
  this.place.marker = new google.maps.Marker({
    position: this.place.position,
    title: this.place.name,
    icon: settings[this.place.type].markerIcon
  });

  // sets the ko observable var rappresenting Place's visibility
  self.isVisible = ko.observable(false);

  // On change on isVisible, the marker visibility on map is toggled
  self.isVisible.subscribe(function(visibility) {
    if (visibility) {
      this.place.marker.setMap(map);
    } else {
      this.place.marker.setMap(null);
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
      self.infoText = "<h2>"+ self.name +"</h2>" +
        "<h4>"+ self.icon +' '+ self.type.capitalize() + "</h4>";

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

  self.placeList = ko.observableArray([]);

  self.currentFilter = ko.observable('');
  self.monumentsFilter = ko.observable(true);
  self.restaurantFilter = ko.observable(true);
  self.nightlifeFilter = ko.observable(true);

  initialPlaces.forEach(function(placeItem) {
    self.placeList.push(new Place(placeItem));
  });

  self.toggleMonuments = function () {
    self.monumentsFilter( !self.monumentsFilter() );
  };
  self.toggleRestaurant = function () {
    self.restaurantFilter( !self.restaurantFilter() );
  };
  self.toggleNightlife = function () {
    self.nightlifeFilter( !self.nightlifeFilter() );
  };

  self.filterPlaces = ko.computed(function () {
    var search  = self.currentFilter().toLowerCase();

    return ko.utils.arrayFilter(self.placeList(), function(place) {
        var match = true;
        if (place.type === 'monument') {
          match = self.monumentsFilter();
        }
        if (place.type === 'restaurant') {
          match = self.restaurantFilter();
        }
        if (place.type === 'nightlife') {
          match = self.nightlifeFilter();
        }
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
}
