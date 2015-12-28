// knockout

// models
var initialPlaces = [
  // Schema for places
  // {
  //   name: ,
  //   type: ,
  //   position: {lat: 45.466342, lng: 9.188288},
  //   address:
  // }
];

var Place = function(data){
  this.position = data.position;
  this.name = data.name;
  this.address = data.address;
  this.type = data.type;
  this.marker = new google.maps.Marker({
    position: this.position,
    title: this.name
  });
  this.marker.setMap(map);
};

// viewmodel
var ViewModel = function () {
  var self = this;

  self.placeList = ko.observableArray([]);

  self.currentFilter = ko.observable();
  self.enableRestaurant = ko.observable();
  self.enableMonuments = ko.observable();
  self.enableNightlife = ko.observable();

  initialPlaces.forEach(function(placeItem) {
    self.placeList.push(new Place(placeItem));
  });

  self.filterPlaces = ko.computed(function() {
    if(!self.currentFilter()) {
      return self.placeList();
    } else {
      return ko.utils.arrayFilter(self.placeList(), function(place) {
        return ~place.name.indexOf(self.currentFilter()) !== 0;
      });
    }
  });

  self.currentPlace = ko.observable();

  self.changeCurrentPlace = function(clickedPlace, event){
    var context = ko.contextFor(event.target);
    var index = context.$index();
    self.currentPlace(self.catList()[index]);
  };
};

ko.applyBindings(new ViewModel());
