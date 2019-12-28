// Get a reference to the database service
var db = firebase.firestore();
var cName = "Players";
var docName = "jJZQHXLl4OPlr6AuGjkt";
var paramName = "Parameters";

var imWidth = 2058
var imHeight = 1122

var hidingState = false;
var hidingX = 0;
var hidingY = 0;

var selectedX = 0;
var selectedY = 0;

var curX = 0;
var curY = 0;
var curRadius = 0;

var radiusShrink = 0.5;
var centerFrac = 0.5;

var previousTime = 0;
var circleNum = 0;

var circleTimes = [1,1,1,1,1];

var interval = 1000;

var map = null;
var center = {lat: 42.359451, lng: -71.093117}
var circle = null;

var metersInLat = 110574.61087757687;

function resetGame() {
	// Reset objects
	db.collection(cName).doc(docName).set({players: 0, found: 0, circleX: center['lat'], circleY: center['lng'], hideX: 0, hideY: 0, radius: 1000 * centerFrac/metersInLat, hiding: true, previousTime: new Date().getTime(), circleNum: 0});
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: center,
		zoom: 19,
		styles: [{
			featureType: 'poi',
			stylers: [{ visibility: 'off' }]  // Turn off points of interest.
		}, {
			featureType: 'transit.station',
			stylers: [{ visibility: 'off' }]  // Turn off bus stations, train stations, etc.
		}],
		disableDoubleClickZoom: true,
		streetViewControl: false
	});
	addClickListener();
}

// Listen for clicks on the map
var spotCircle = null;
function addClickListener() {
	map.addListener('click', function(e) {
		selectedX = e.latLng.lat();
		selectedY = e.latLng.lng();
		if (hidingState == true) {
			if (spotCircle != null) {
				spotCircle.setMap(null);
			}
			spotCircle = new google.maps.Circle({
				strokeColor: '#FF0000',
				strokeOpacity: 0.8,
				strokeWeight: 2,
				fillColor: '#FF0000',
				fillOpacity: 0.35,
				map: map,
				center: {lat: selectedX, lng: selectedY},
				radius: 10
			});
		}
	});
}

function drawMap(data) {
	updateCircle(data);
}

function recalculateCircle() {
	console.log(curRadius);
	var newRadius = curRadius * radiusShrink;
	var maxDist = curRadius * (1 - radiusShrink);
	var maxTheta = 2 * Math.PI;
	console.log("HELLO");
	
	var newX = -1;
	var newY = -1;

	while (true) {
		var newDist = Math.random() * maxDist;
		var theta = Math.random() * maxTheta;

		xOff = newDist*Math.cos(theta);
		yOff = newDist*Math.sin(theta);
		
		newX = curX + xOff;
		newY = curY + yOff;
		var distance = (Math.pow( Math.pow(newX - hidingX, 2) + Math.pow(newY - hidingY, 2), 0.5 ));
		
		console.log(distance);
		console.log(curRadius*radiusShrink);

		// If the new point isn't contained, continue randomly creating new circles
		if (distance < newRadius) {
			break;
		}
	}
	
	db.collection(cName).doc(docName).get().then(function(doc) {
    	if (doc.exists) {
			var data = doc.data();
			data.circleX = newX;
			data.circleY = newY;
			data.radius = newRadius;
			data.previousTime = new Date().getTime();
			data.circleNum = data.circleNum + 1;
			db.collection(cName).doc(docName).set(data);
    	} else {
        	// doc.data() will be undefined in this case
        	console.log("No such document!");
    	}
	}).catch(function(error) {
    	console.log("Error getting document:", error);
	});

}

function checkRecalculateCircle() {
	if (hidingState == false) {
		var timeDiff = circleTimes[circleNum];
		if (new Date().getTime() > timeDiff*1000*60 + previousTime) {
			recalculateCircle();
		}

		var timeHeader = document.getElementById("Times");
		timeHeader.textContent = "Time Left: " + Math.floor(timeDiff + previousTime/60000 - (new Date().getTime()/60000)).toString();
	}
}

function updateCircle(data) {
	// Now draw the circle
	var x = data.circleX;
	var y = data.circleY;
	var radius = data.radius;

	// Remove the current circle and draw the new one
	if (circle != null) {
		circle.setMap(null);
	}
	if (hidingState != true) {
		circle = new google.maps.Circle({
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			map: map,
			center: {lat: x, lng: y},
			radius: radius * metersInLat
		});
	}
	console.log('Drawing circle...');
}

function update(data) {
		
	if (data == {} || data == undefined) {
		db.collection(cName).doc(docName).get().then(function(doc) {
			if (doc.exists) {
				// Do the first update
				update(doc.data());
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
			}
		}).catch(function(error) {
			console.log("Error getting document:", error);
		});
	} else {
		// Set the player text
		var found = document.getElementById("found");
		var playerCount = data.players;
		var foundCount = data.found;
		
		// Set the text
		found.textContent = foundCount.toString() + "/" + playerCount.toString();
		
		// Update the variables
		hidingState = data.hiding;
		curX = data.circleX;
		curY = data.circleY;
		curRadius = data.radius;
		hidingX = data.hideX;
		hidingY = data.hideY;
		previousTime = data.previousTime;
		circleNum = data.circleNum;
		
		// Draw the stuffz
		drawMap(data);
	}
}

function addPlayer() {
	db.collection(cName).doc(docName).get().then(function(doc) {
    	if (doc.exists) {
        	console.log("Document data:", doc.data());
			var data = doc.data();
			data.players = data.players + 1;
			db.collection(cName).doc(docName).set(data);
    	} else {
        	// doc.data() will be undefined in this case
        	console.log("No such document!");
    	}
	}).catch(function(error) {
    	console.log("Error getting document:", error);
	});
}

function selectCircle() {
	db.collection(cName).doc(docName).get().then(function(doc) {
    	if (doc.exists) {
        	console.log("Document data:", doc.data());
			var data = doc.data();
			data.hideX = selectedX;
			data.hideY = selectedY;
			data.hiding = false;
			db.collection(cName).doc(docName).set(data);
    	} else {
        	// doc.data() will be undefined in this case
        	console.log("No such document!");
    	}
	}).catch(function(error) {
    	console.log("Error getting document:", error);
	});
}

function addFound() {
	db.collection(cName).doc(docName).get().then(function(doc) {
    	if (doc.exists) {
        	console.log("Document data:", doc.data());
			var data = doc.data();
			data.found = data.found + 1;
			db.collection(cName).doc(docName).set(data);
    	} else {
        	// doc.data() will be undefined in this case
        	console.log("No such document!");
    	}
	}).catch(function(error) {
    	console.log("Error getting document:", error);
	});
}

// Realtime monitor changes in the database
db.collection(cName).doc(docName)
    .onSnapshot(function(doc) {
        console.log("Current data: ", doc.data());
		update(doc.data());
    });

// Update the parameters
db.collection(cName).doc(paramName).get().then(function(doc) {
   	if (doc.exists) {
		// Update the parameters
		centerFrac = doc.data().centerFrac;
		radiusShrink = doc.data().radiusShrink;
		circleTimes = doc.data().circleTimes;
		update();   		
	} else {
       	// doc.data() will be undefined in this case
       	console.log("No such document!");
   	}
}).catch(function(error) {
   	console.log("Error getting document:", error);
});

// Now setup the canvas object
/*
var canvas = document.getElementById("myCanvas");
canvas.addEventListener('click', function(e) {
	var offX = e.offsetX;
	var offY = e.offsetY;
	
	selectedX = offX;
	selectedY = offY;
	console.log(hidingState);	
	if (hidingState == true) {
		var ctx = canvas.getContext("2d");
		ctx.beginPath();
		ctx.arc(offX, offY, 10, 0, 2*Math.PI);
		ctx.stroke();
	}
});
*/


// Check the circle
var checkingTime = setInterval(checkRecalculateCircle, interval);

