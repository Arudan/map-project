// GoogleMap init
var map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 45.466342, lng: 9.188288},
    zoom: 13,
    disableDefaultUI: true
  });
}

// knockout

// models
var initialPlaces = [
  // Schema for places
  // {
  //   name: ,
  //   type: ,
  //   latitude: ,
  //   longitude: ,
  //   address:
  // }
];

var Place = function(data){
  this.latitude = data.latitude;
  this.longitude = data.longitude;
  this.name = data.name;
  this.address = data.address;
  this.type = data.type;
};

// viewmodel
var ViewModel = function () {
  var self = this;

  self.placeList = ko.observableArray([]);

  initialPlaces.forEach(function(placeItem) {
    self.placeList.push(new Place(placeItem));
  });

  self.currentPlace = ko.observable();

  self.changeCurrentPlace = function(clickedPlace, event){
    var context = ko.contextFor(event.target);
    var index = context.$index();
    self.currentPlace(self.catList()[index]);
  };
};

ko.applyBindings(new ViewModel());
