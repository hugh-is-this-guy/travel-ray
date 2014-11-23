var Map = (function () {
	'use strict';

	function Map(height, width) {
		this.height = height;
		this.width = width;

		this.places = [];
		this.routes = [];
		this.lastPlace = null;
	};

	Map.prototype.init = function(cssTarget) {
		if (typeof d3 == 'undefined') {
			throw "Map requires d3.";
		}

		this.svg = d3.select("#map").append("svg")
			.attr("width", width)
			.attr("height", height);

		this.projection = d3.geo.mercator()
			.center([115, 0])
			.rotate([0, 5])
			.scale(800)
			.translate([width / 2, height / 2]);

		this.path = d3.geo.path()
			.projection(this.projection);

		return this;
	};

	Map.prototype.addJson = function(json) {
		var subunits = topojson.feature(json, json.objects.subunits);

		this.svg.selectAll(".subunit")
				.data(topojson.feature(json, json.objects.subunits).features)
			.enter().append("path")
				.attr("class", function(d) {
					return "subunit " + d.id; 
				})
				.attr("d", this.path);

		this.svg.append("path")
			.datum(topojson.mesh(json, json.objects.subunits, function(a, b) { return a !== b }))
			.attr("d", this.path)
			.attr("class", "subunit-boundary");

		return this;
	};

	Map.prototype.addPlaces = function(newPlaces) {
		this.places = newPlaces;
		this.render();

		this.lastPlace = newPlaces[newPlaces.length - 1];

		// if(this.lastPlace != null){
		// 	this.addRoute(this.lastPlace, newPlace);
		// };

		// this.lastPlace = newPlace;

		// if(newPlaces.length > 0) {
		// 	setTimeout(function() {
		// 		this.addPlaces(newPlaces)
		// 	}.bind(this), 1000);
		// }
	};

	Map.prototype.addPlace = function(place) {
		this.places.push(place);
		this.render;

	};

	Map.prototype.render = function(){
		var self = this;
		this.svg.selectAll(".place")
			.data(this.places, function (d) { return d.id; })
			.enter()
			.append("circle", ".place")
			.attr("r", 0)
			.attr("transform", function(d) {
				return "translate(" + self.projection([
					d.location.longitude,
					d.location.latitude
				]) + ")"
			})
			.attr("id", function(d) {
				return d.id;
			})
			.attr('fill', '#cc0000')
			.transition()
			.delay(function (d, i) {
				return ((i + 1) * 750);
			})
			.attr('r', 5)
			.each(function (d, i){
				if (i > 0) {
					var from = self.places[i-1];
					var to = d;

					self.addRoute(from, to, i * 750);
				};
			});
		
	};

	Map.prototype.addRoute = function(from, to, delay) {
		var route = new Route(from, to, this.projection);
		var length = route.getLength();

		console.log(Math.abs(length));
		if (Math.abs(length) >= 10) {

			console.log("Yes");

			self = this;
			this.svg.append("path", ".route")
				.attr("d", function() {
					return route.getPath();
				})
				.attr("id", function() {
					return route.id;
				})
				.attr("stroke", "grey")
				.attr("stroke-width", "2")
				.attr("stroke-dasharray", length + " " + length)
				.attr("stroke-dashoffset", length)
				.transition().ease(d3.ease('cubic'))
				.duration(750)
				.delay(delay)
				.attr('stroke-dashoffset', 0);

		};
	};

	var Route = function(from, to, projection) {
		this.id = from.id + "->" + to.id;
		this.from = from;
		this.to = to;
		this.projection = projection;

		this.fromCoords = this.projection(
			[
				this.from.location.longitude,
				this.from.location.latitude
			]
		);
		this.toCoords = this.projection(
			[
				this.to.location.longitude,
				this.to.location.latitude
			]
		);

		this.calculateCoordinates();
	};

	Route.prototype.calculateCoordinates = function() {
		var height = this.fromCoords[0] - this.toCoords[0];
		var width = this.fromCoords[1] - this.toCoords[1];

		var length = Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2));
		var angle = Math.acos(width / length);

		var verticalReduction = Math.abs(Math.sin(angle) * 5);
		var horizontalReduction = Math.abs(Math.cos(angle) * 5);


		if (height < 0) {
			verticalReduction = verticalReduction * -1;
		}

		if (width < 0) {
			horizontalReduction = horizontalReduction * -1;
		}

		this.toCoords = [
			this.toCoords[0] + verticalReduction, 
			this.toCoords[1] + horizontalReduction
		];

		this.fromCoords = [
			this.fromCoords[0] - verticalReduction, 
			this.fromCoords[1] - horizontalReduction
		];

	};

	Route.prototype.toDegrees = function(angle) {
		return angle * (180 / Math.PI);
	}

	Route.prototype.getLength = function() {
		var height = Math.abs(this.fromCoords[0] - this.toCoords[0]);
		var width = Math.abs(this.fromCoords[1] - this.toCoords[1]);
		return Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2));
	};



	Route.prototype.getPath = function() {
		var path = "M " + this.fromCoords[0] + " " + this.fromCoords[1] + " L " + this.toCoords[0] + " " + this.toCoords[1];
		return path;
	};

	return Map;
})()