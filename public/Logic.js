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

function resetGame() {
	// Reset objects
	db.collection(cName).doc(docName).set({players: 0, found: 0, circleX: imWidth/2, circleY: imHeight/2, hideX: 0, hideY: 0, radius: 2000 * centerFrac, hiding: true, previousTime: new Date().getTime(), circleNum: 0});
}

function drawMap(data) {
	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	var img = new Image();
	img.onload = function() {
		ctx.drawImage(img, 0, 0);
		updateCircle(data);
	};
	img.src = 'MIT_map.png';
}

function recalculateCircle() {
	var newRadius = Math.ceil(curRadius * radiusShrink);
	var maxDist = curRadius * (1 - radiusShrink);
	var maxTheta = 2 * Math.PI;
	console.log("HELLO");
	
	var newX = -1;
	var newY = -1;

	while (true) {
		var newDist = Math.ceil(Math.random() * maxDist);
		var theta = Math.random() * maxTheta;

		xOff = Math.ceil(newDist*Math.cos(theta));
		yOff = Math.ceil(newDist*Math.sin(theta));

		newX = curX + xOff;
		newY = curY + yOff;
		var distance = Math.ceil(Math.pow( Math.pow(newX - hidingX, 2) + Math.pow(newY - hidingY, 2), 0.5 ));
		
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
	var canvas = document.getElementById("myCanvas");
	var ctx = canvas.getContext("2d");
	ctx.beginPath();
	ctx.arc(x, y, (1/centerFrac)*radius, 0, 2*Math.PI);
	ctx.stroke();
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

// Check the circle
var checkingTime = setInterval(checkRecalculateCircle, interval);

