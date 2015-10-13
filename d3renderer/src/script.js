/**
 * @fbielejec
 */

// console.log("Slider:" + dateFormat(new Date(value)));
// console.log(line.attributes.startTime.value);
// ///////////////////
// --- VARIABLES ---//
// ///////////////////
//
// ---MAP---//
//
var width = document.getElementById('container').offsetWidth;
var height = width / 2;
var graticule = d3.geo.graticule();
var scale;

//
// ---DATA---//
//

// /////////////////
// ---FUNCTIONS---//
// /////////////////

function move() {

	var t = d3.event.translate;
	var s = d3.event.scale;
	var h = height / 4;

	t[0] = Math
			.min((width / height) * (s - 1), Math.max(width * (1 - s), t[0]));

	t[1] = Math.min(h * (s - 1) + h * s, Math.max(height * (1 - s) - h * s,
			t[1]));

	zoom.translate(t);
	g.attr("transform", "translate(" + t + ")scale(" + s + ")");

	// fit the paths to the zoom level
	d3.selectAll(".country").attr("stroke-width", 1.0 / s);
	d3.selectAll(".line").attr("stroke-width", 1.0 / s);
	d3.selectAll(".point").attr("stroke-width", 1.0 / s);

}// END: move

function initializeLayers(layers, pointAttributes, lineAttributes) {

	// ---DATA LAYER---//

	layers.forEach(function(layer) {

		var type = layer.type;
		if (type == TREE) {

			var points = layer.points;
			generatePoints(points);

			var lines = layer.lines;
			generateLines(lines, points);

			var areas = layer.areas;
			if (typeof areas != 'undefined') {
				generateAreas(areas);
			}

		} else if (type == COUNTS) {

			var countAttribute = getObject(pointAttributes, "id", COUNT);
			var counts = layer.points;
			generateCounts(counts, countAttribute);

		} else {

			// do nothing

		}

	});

}// END: initializeLayers

function updateDateDisplay(value, timeScale, currentDateDisplay, dateFormat) {

	var currentDate = timeScale.invert(timeScale(value));
	currentDateDisplay.text(dateFormat(currentDate));

}// END: updateDateDisplay

function update(value, timeScale, currentDateDisplay, dateFormat) {

	updateDateDisplay(value, timeScale, currentDateDisplay, dateFormat);

	// ---LINES---//

	// ---select lines painting now---//

	linesLayer.selectAll("path.line") //
	.filter(function(d) {

		var linePath = this;
		var lineStartDate = Date.parse(linePath.attributes.startTime.value);
		var lineEndDate = Date.parse(linePath.attributes.endTime.value);

		return (lineStartDate <= value && value <= lineEndDate);
	}) //
	.transition() //
	.ease("linear") //
	.attr("stroke-dashoffset", function(d, i) {

		var linePath = this;
		var totalLength = linePath.getTotalLength();

		var lineStartDate = Date.parse(linePath.attributes.startTime.value);
		var lineEndDate = Date.parse(linePath.attributes.endTime.value);
		var duration = lineEndDate - lineStartDate;

		var timePassed = value - lineStartDate;

		var offset = totalLength;
		if (duration == 0) {

			offset = 0;

		} else {

			offset = map(timePassed, 0, duration, 0, totalLength);

			if (d.westofsource) {

				offset = offset + totalLength;

			} else {

				offset = totalLength - offset;
			}

		}// END: instantaneous line check

		return (offset);
	}) //
	.style("visibility", "visible") //
	.attr("opacity", 1);

	// ---select lines yet to be painted---//

	linesLayer.selectAll("path.line") //
	.filter(function(d) {
		var linePath = this;
		var lineStartDate = Date.parse(linePath.attributes.startTime.value);

		return (lineStartDate > value);
	}) //
	.attr("stroke-dashoffset", function(d, i) {
		var linePath = this;
		var totalLength = linePath.getTotalLength();

		return (totalLength);
	}) //
	.style("visibility", "hidden") //
	.attr("opacity", 0);

	// ---select lines already painted---//

	linesLayer.selectAll("path.line") //
	.filter(function(d) {
		var linePath = this;
		var lineEndDate = Date.parse(linePath.attributes.endTime.value);

		return (lineEndDate < value);
	}) //
	.attr("stroke-dashoffset", 0) //
	.style("visibility", "visible") //
	.attr("opacity", 1);

	// ---POLYGONS---//
	
	// ---select polygons yet to be displayed---//
	
	areasLayer.selectAll(".polygon") //
	.filter(function(d) {
		var polygon = this;
		var startDate = Date.parse(polygon.attributes.startTime.value);

		return (value < startDate);
	}) //
	.transition() //
	.ease("linear") //
	.duration(1000) //
	.attr("visibility", "hidden") //
	.attr("opacity", 0);
	
	// ---select polygons displayed now---//
	
	areasLayer.selectAll(".polygon") //
	.filter(function(d) {
		var polygon = this;
		var startDate = Date.parse(polygon.attributes.startTime.value);

		return (value >= startDate);
	}) //
	.transition() //
	.ease("linear") //
	.duration(1000) //
	.attr("visibility", "visible") //
	.attr("opacity", COUNT_OPACITY);
	
	// ---COUNTS---//

	// ---select counts yet to be displayed or already displayed---//

	areasLayer.selectAll(".circle") //
	.filter(function(d) {
		var point = this;
		var startDate = Date.parse(point.attributes.startTime.value);
		var endDate = Date.parse(point.attributes.endTime.value);

		return (value < startDate || value > endDate);
	}) //
	.transition() //
	.ease("linear") //
	.duration(1000) //
	.attr("visibility", "hidden") //
	.attr("opacity", 0);

	// ---select counts displayed now---//

	areasLayer.selectAll(".circle") //
	.filter(function() {
		var point = this;
		var startDate = Date.parse(point.attributes.startTime.value);
		var endDate = Date.parse(point.attributes.endTime.value);

		return (value > startDate && value < endDate);
	}) //
	.transition() //
	.duration(100) //
	.ease("linear") //
	.attr("visibility", "visible") //
	.attr("opacity", COUNT_OPACITY);

}// END: update

function initializeTimeSlider(timeSlider, timeScale, currentDateDisplay,
		dateFormat) {

	// time slider listener
	timeSlider.on('slide', function(evt, value) {

		update(value, timeScale, currentDateDisplay, dateFormat);
		currentSliderValue = value;

	});// END: slide

	var playPauseButton = d3.select('#playPause').attr("class", "playPause")
			.on(
					"click",
					function() {

						if (playing) {
							playing = false;
							playPauseButton.classed("playing", playing);

							clearInterval(processID);

						} else {
							playing = true;
							playPauseButton.classed("playing", playing);

							processID = setInterval(function() {

								var sliderValue = currentSliderValue
										+ sliderInterval;
								if (sliderValue > sliderEndValue) {
									sliderValue = sliderStartValue;
								}

								timeSlider.value(sliderValue);
								update(sliderValue, timeScale,
										currentDateDisplay, dateFormat);

								currentSliderValue = sliderValue;

							}, 100);

						}// END: playing check

					});

}// END: initializeTimeSlider

// ///////////////
// ---ZOOMING---//
// ///////////////

function clicked() {
	svg.call(zoom.event);

	var center0 = zoom.center();
	var translate0 = zoom.translate();
	var coordinates0 = coordinates(center0);

	// console.log(zoom.scale());

	zoom.scale(zoom.scale() * Math.pow(1.5, +this.getAttribute("data-zoom")));

	if (zoom.scale() < minScaleExtent) {
		zoom.scale(minScaleExtent);
	}

	if (zoom.scale() > maxScaleExtent) {
		zoom.scale(maxScaleExtent);
	}

	// Translate back to the center.
	var center1 = point(coordinates0);
	zoom.translate([ translate0[0] + center0[0] - center1[0],
			translate0[1] + center0[1] - center1[1] ]);

	svg.transition().duration(750).call(zoom.event);
}

function coordinates(point) {
	var scale = zoom.scale(), translate = zoom.translate();
	return [ (point[0] - translate[0]) / scale,
			(point[1] - translate[1]) / scale ];
}

function point(coordinates) {
	var scale = zoom.scale(), translate = zoom.translate();
	return [ coordinates[0] * scale + translate[0],
			coordinates[1] * scale + translate[1] ];
}

// /////////////////
// ---RENDERING---//
// /////////////////

// ---DRAW MAP BACKGROUND---//

var minScaleExtent = 1;
var maxScaleExtent = 4;

var zoom = d3.behavior.zoom().scaleExtent([ minScaleExtent, maxScaleExtent ])
		.center([ width / 2, height / 2 ]).size([ width, height ]).on("zoom",
				move);

// layers
var svg = d3.select("#container").append('svg').attr('width', width).attr(
		'height', height).call(zoom);

d3.selectAll("button[data-zoom]").on("click", clicked);

var g = svg.append("g");
var equatorLayer = g.append("g");
var topoLayer = g.append("g");

var areasLayer = g.append("g");
var pointsLayer = g.append("g");
var linesLayer = g.append("g");
var locationsLayer = g.append("g");
var labelsLayer = g.append("g");

var projection;

// time slider
var playing = false;
var processID;
var currentSliderValue;
var sliderInterval;
var sliderStartValue;
var sliderEndValue;

// d3.json("data/ebov_discrete.json", function ready(error, json) {
 d3.json("data/continuous_test.json", function ready(error, json) {
//d3.json("data/antigenic_test.json", function ready(error, json) {

	// -- TIME LINE-- //

	var dateFormat = d3.time.format("%Y-%m-%d");
	var timeLine = json.timeLine;

	var startDate = new Date(timeLine.startTime);
	var endDate = new Date(timeLine.endTime);

	sliderStartValue = Date.parse(timeLine.startTime);
	sliderEndValue = Date.parse(timeLine.endTime);
	currentSliderValue = sliderStartValue;

	// TODO: slider for speed control
	var sliderSpeed = 100;
	var duration = sliderEndValue - sliderStartValue;
	sliderInterval = duration / sliderSpeed;

	// initial value
	var currentDateDisplay = d3.select('#currentDate').text(
			dateFormat(startDate));

	var timeScale = d3.time.scale.utc().domain([ startDate, endDate ]).range(
			[ 0, 1 ]);
	var timeSlider = d3.slider().scale(timeScale).axis(d3.svg.axis());
	d3.select('#timeSlider').call(timeSlider);

	// ---ATTRIBUTES---//

	populateLocationPanels();

	var lineAttributes = json.lineAttributes;
	populateLinePanels(lineAttributes);

	var pointAttributes = json.pointAttributes;
	populatePointPanels(pointAttributes);

	var mapAttributes = json.mapAttributes;
	if (typeof mapAttributes != 'undefined') {
		populateMapPanels(mapAttributes);
	}

	// ---LAYERS---//

	var layers = json.layers;

	// ---MAP LAYER---//

	var mapRendered = false;
	layers.forEach(function(layer) {

		var type = layer.type;
		if (type == MAP) {

			var geojson = layer.geojson;
			generateTopoLayer(geojson);
			// TODO: make it look good with the world layer
			// generateWorldLayer(geojson);

			mapRendered = true;

		}

	});

	// if no geojson layer found
	if (!mapRendered) {

		populateMapBackground();
		generateEmptyLayer(pointAttributes);

		// ---TIME SLIDER---//

		initializeTimeSlider(timeSlider, timeScale, currentDateDisplay,
				dateFormat);

		// put slider at the end of timeLine, everything painted
		timeSlider.value(sliderEndValue);

		updateDateDisplay(sliderEndValue, timeScale, currentDateDisplay,
				dateFormat);

		// ---DATA LAYERS---//

		initializeLayers(layers, pointAttributes, lineAttributes);

		// ---LOCATIONS---//

		var locations = json.locations;
		if (typeof (locations) != 'undefined') {

			generateLocations(locations);
			generateLabels(locations);

		}// END: null check

		// function readynow(error, world) {
		//
		// populateMapPanels(world.mapAttributes);
		//
		// generateWorldLayer(world);
		// // mapRendered = true;
		//
		// // ---TIME SLIDER---//
		//
		// initializeTimeSlider(timeSlider, timeScale, currentDateDisplay,
		// dateFormat);
		//
		// // put slider at the end of timeLine, everything painted
		// timeSlider.value(sliderEndValue);
		//
		// updateDateDisplay(sliderEndValue, timeScale, currentDateDisplay,
		// dateFormat);
		//
		// // ---DATA LAYERS---//
		//
		// initializeLayers(layers, pointAttributes, lineAttributes);
		//
		// // ---LOCATIONS---//
		//
		// var locations = json.locations;
		// if (typeof(locations) != 'undefined') {
		//
		// generateLocations(locations);
		// generateLabels(locations);
		//
		// }// END: null check
		//
		// }// END: readynow
		//
		// queue().defer(d3.json, "data/world.geojson").await(readynow);

	} else {

		// ---TIME SLIDER---//

		initializeTimeSlider(timeSlider, timeScale, currentDateDisplay,
				dateFormat);

		// put slider at the end of timeLine, everything painted
		timeSlider.value(sliderEndValue);

		updateDateDisplay(sliderEndValue, timeScale, currentDateDisplay,
				dateFormat);

		// ---DATA LAYERS---//

		initializeLayers(layers, pointAttributes, lineAttributes);

		// ---LOCATIONS---//

		var locations = json.locations;
		if (typeof (locations) != 'undefined') {

			generateLocations(locations);
			generateLabels(locations);

		}// END: null check

		// console.log(locations);

	}// END: mapRendered check

	populateExportPanel();

} // END: function
);
