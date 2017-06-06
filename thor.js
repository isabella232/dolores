var isNode = (typeof module !== 'undefined' && module.exports);
if(isNode) {
    let _maze = require('./maze.js');
    maze = _maze.maze;
    getURLParameter = _maze.getURLParameter;
}

var thor = function(W_BACKTRACK = 2, W_DIAG = 4, W_HORIZ = 0, W_VERT = -2, W_DIST = -2, kill = 0) {
    function vector_add(a, b) {
	return {x: a.x + b.x, y: a.y + b.y};
    }
    function vector_sub(a, b) {
	return {x: a.x - b.x, y: a.y - b.y};
    }
    function vector_scale(a, s) {
	return {x: a.x * s, y: a.y * s};
    }
    function vector_mag(a) {
	return Math.sqrt(a.x * a.x + a.y * a.y);
    }
    function vector_dist(a, b) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;

	return Math.sqrt(dx*dx + dy*dy);
    }
    function vector_new(x, y) {
	return {x:x, y:y};
    }
	
    const VEC_U = vector_new(0, -1);
    const VEC_D = vector_new(0, 1);
    const VEC_R = vector_new(1, 0);
    const VEC_L = vector_new(-1, 0);

    const DATA_CODE_UNKNOWN = 5;
    const DATA_CODE_FLOOR = 6;
    const DATA_CODE_WALL = 7;
    const DATA_CODE_LOCKED = 8;

    const CELL_CODE_UP = "u";
    const CELL_CODE_DOWN = "d";
    const CELL_CODE_LEFT = "l";
    const CELL_CODE_RIGHT = "r";
    const CELL_CODE_LIST = [CELL_CODE_LEFT, CELL_CODE_UP, CELL_CODE_RIGHT, CELL_CODE_DOWN];

    // Dictionary of code => direction
    const CELL_CODE_DIR_MAP = (function() {
	    let result = {};

	    result[CELL_CODE_UP] = VEC_U;
	    result[CELL_CODE_DOWN] = VEC_D;
	    result[CELL_CODE_LEFT] = VEC_L;
	    result[CELL_CODE_RIGHT] = VEC_R;

	    return result;
	})();

    // Dictionary of code => cssClass
    const CELL_CODE_CSS_MAP = (function() {
            let result = {};

            result[CELL_CODE_UP] = "top";
            result[CELL_CODE_DOWN] = "bottom";
            result[CELL_CODE_LEFT] = "left";
            result[CELL_CODE_RIGHT] = "right";

            return result;
        })();

    function MazeData(rootLoc, rootData){
	// data is dynamically allocated array
	let data = [];
	
	// Our current best guess on the map size
	let knownWalkableWidth = 1;
	let knownWalkableHeight = 1;

	// Get data at x,y if not found return CELL_CODE_UNKNOWN
	function getData(loc) {
	    if(loc.x >= 0 && loc.y >= 0) {
		const cell = data[loc.x];
		if(cell) {
		    return cell[loc.y] || DATA_CODE_UNKNOWN;
		}
		
		return DATA_CODE_UNKNOWN;
	    }

	    return DATA_CODE_WALL;
	}
	
	// Set data at x,y will create missing rows
	function setData(loc, code) {
	    if(!data[loc.x]) {
		data[loc.x] = [];
	    }
	    
	    data[loc.x][loc.y] = code;
	}

	function floodBottom(startPos) {
	    let floodFailed = false;
	    startPos = {x: Math.floor(startPos.x/2), y: Math.floor(startPos.y/2)};

	    floodFill(startPos, function (fillLoc, dist) {
		    if(dist > 10 || mazeData.getAvailableDirections(fillLoc).length > 0) {
			floodFailed = true;
		    }

		    // Ignore things too many moves away
		    if(floodFailed) {
			return [];
		    }

		    let result = [];
		    const codes = Object.keys(CELL_CODE_DIR_MAP);
		    for(let i = 0, len = codes.length; i < len; i++) {
			const dirCode = codes[i];
			const dir = CELL_CODE_DIR_MAP[dirCode];
			const testLoc = vector_add(fillLoc, dir);
			const doorCode = mazeData.getDataCode(fillLoc, dir);
			const destCode = mazeData.getDataCode(testLoc);

			if(testLoc.x <= knownWalkableWidth && testLoc.y <= knownWalkableHeight) {
			    if (doorCode === DATA_CODE_UNKNOWN && destCode === DATA_CODE_UNKNOWN)
				result.push(testLoc);
			}
		    }

		    return result;
		}, function(fillLoc) {
		    return false;
		});

	    return floodFailed;
	}

	// Check for a horizontal wall starting at loc, long enough to guess the bottom of the map
	this.checkForBottom = function(walkableLoc) {
	    if(walkableLoc.y > knownWalkableHeight) {
		return false;
	    }

	    const MOVE_LEFT = vector_scale(VEC_L, 2);
	    const MOVE_RIGHT = vector_scale(VEC_R, 2);
	    const MAX_NATURAL_LENGTH = 15; // The max length of a wall before it's probably the boundary
	    const loc = vector_scale(walkableLoc, 2);
	    let len = 0;

	    // Check start
	    if(getData(vector_add(loc, VEC_D)) === DATA_CODE_WALL) {
		len = 1;
	    } else {
		return false;
	    }

	    // Check left
	    let checkLoc = vector_add(loc, MOVE_LEFT);
	    while(getData(vector_add(checkLoc, VEC_D)) === DATA_CODE_WALL && checkLoc.x > 0 && len < MAX_NATURAL_LENGTH) {
		len++;
		checkLoc = vector_add(checkLoc, MOVE_LEFT);
	    }
	    let leftExtent = checkLoc;

	    // Check right
	    checkLoc = vector_add(loc, MOVE_RIGHT);
	    while(getData(vector_add(checkLoc, VEC_D)) === DATA_CODE_WALL && checkLoc.x < knownWalkableWidth*2 && len < MAX_NATURAL_LENGTH) {
                len++;
		checkLoc = vector_add(checkLoc, MOVE_RIGHT);
            }
	    let rightExtent = checkLoc;

	    // Quit now
	    if(len >= MAX_NATURAL_LENGTH) {
		return true;
	    }

	    // Try to hop gap left
	    checkLoc = leftExtent; //vector_add(leftExtent, MOVE_LEFT);
	    while(checkLoc.x > 0 && !floodBottom(checkLoc) && len < MAX_NATURAL_LENGTH) {
		while(getData(vector_add(checkLoc, VEC_D)) !== DATA_CODE_WALL && checkLoc.x > 0) {
		    checkLoc = vector_add(checkLoc, MOVE_LEFT);
		}

		while(getData(vector_add(checkLoc, VEC_D)) === DATA_CODE_WALL && checkLoc.x > 0 && len < MAX_NATURAL_LENGTH) {
		    len++;
		    checkLoc = vector_add(checkLoc, MOVE_LEFT);
		}
	    }

	    // Quit now
            if(len >= MAX_NATURAL_LENGTH) {
                return true;
            }

	    // Try to hop gap right
	    checkLoc = rightExtent; //vector_add(rightExtent, MOVE_RIGHT);
            while(checkLoc.x < knownWalkableWidth*2 && !floodBottom(checkLoc) && len < MAX_NATURAL_LENGTH) {
                while(getData(vector_add(checkLoc, VEC_D)) !== DATA_CODE_WALL && checkLoc.x < knownWalkableWidth*2) {
                    checkLoc = vector_add(checkLoc, MOVE_RIGHT);
                }

                while(getData(vector_add(checkLoc, VEC_D)) === DATA_CODE_WALL && checkLoc.x < knownWalkableWidth*2 && len < MAX_NATURAL_LENGTH) {
                    len++;
                    checkLoc = vector_add(checkLoc, MOVE_RIGHT);
                }
            }

	    // Quit now
            if(len >= MAX_NATURAL_LENGTH) {
                return true;
            }
	    return false;
	}
	
	this.getKnownSize = function() {
	    return vector_new(knownWalkableWidth, knownWalkableHeight);
	}

	this.setKnownWidth = function(walkableWidth) {
	    if(knownWalkableWidth < walkableWidth) {
		knownWalkableWidth = walkableWidth;
	    }
	}

	// Create dom elements to debug maze data
	// Should look like the original maze
	this.buildDom = function(rootNode, walkableWidth, walkableHeight) {
	    var row;
	    
	    for(var y = 0; y < walkableHeight; y++){
		let row = document.createElement("div");
		row.className = "row";
		rootNode.appendChild(row);
		
		for(var x = 0; x < walkableWidth; x++){
		    const dataLoc = vector_scale(vector_new(x,y), 2);
		    const node = document.createElement("div");
		    let cssClass = "node";
		    
		    cssClass += " " + (getData(dataLoc) === DATA_CODE_FLOOR ? "F" : "U");

		    for(var j in CELL_CODE_DIR_MAP) {
			let wallType = getData(vector_add(dataLoc, CELL_CODE_DIR_MAP[j]));
			if(wallType === DATA_CODE_WALL) {
			    cssClass += " W" + CELL_CODE_CSS_MAP[j] + " " + CELL_CODE_CSS_MAP[j];
			} else if(wallType === DATA_CODE_LOCKED) {
			    cssClass += " L" + CELL_CODE_CSS_MAP[j] + " " + CELL_CODE_CSS_MAP[j];
			} else if(wallType === DATA_CODE_FLOOR) {
			    cssClass += " F" + CELL_CODE_CSS_MAP[j] + " " + CELL_CODE_CSS_MAP[j];
			}
		    }
		    
		    node.id = x + "_" + y;
		    node.className = cssClass;
		    row.appendChild(node);
		}
	    }
	}

	// Get the data code for a location, and optionally in a direction from that loc
	this.getDataCode = function(walkableLoc, dir = vector_new(0,0)) {
	    return getData(vector_add(vector_scale(walkableLoc, 2), dir));
	}
	
	// Add api data to maze at a walking location
	this.addApiData = function(walkableLoc, apiData) {
	    // Our data location is 2x because of wall data
	    let loc = vector_scale(walkableLoc, 2);

	    // Extend map bounds
	    if(walkableLoc.x > knownWalkableWidth) {
		knownWalkableWidth = walkableLoc.x;
	    }
	    if(walkableLoc.y > knownWalkableHeight) {
		knownWalkableHeight = walkableLoc.y;
	    }
	    
	    // Set this location
	    setData(loc, DATA_CODE_FLOOR);
	    
	    // Set connecting walls
	    let code;
	    if(apiData[CELL_CODE_UP]) {
		code = DATA_CODE_FLOOR;
	    } else {
		code = DATA_CODE_WALL;
	    }
	    setData(vector_add(loc, VEC_U), code);

	    if(apiData[CELL_CODE_DOWN]) {
		code = DATA_CODE_FLOOR;
	    } else {
		code = DATA_CODE_WALL;
	    }
	    setData(vector_add(loc, VEC_D), code);

	    if(apiData[CELL_CODE_LEFT]) {
		code = DATA_CODE_FLOOR;
	    } else {
		code = DATA_CODE_WALL;
	    }
	    setData(vector_add(loc, VEC_L), code);

	    if(apiData[CELL_CODE_RIGHT]) {
		code = DATA_CODE_FLOOR;
	    } else {
		code = DATA_CODE_WALL;
	    }
	    setData(vector_add(loc, VEC_R), code);
	}

	// Returns true if you can move in dir from loc
	this.canMove = function(walkableFromLoc, dir) {
	    const dataLoc = vector_scale(walkableFromLoc, 2);
	    return getData(vector_add(dataLoc, dir)) === DATA_CODE_FLOOR;
	}

	// Returns an array of Vector directions that you could move in
	this.getAvailableDirections = function(walkableFromLoc) {
	    const allowed = new Array(4);
	    let i = 0;
	    
	    if(this.canMove(walkableFromLoc, VEC_U)) {
		allowed[i] = VEC_U;
		i++;
	    }
	    if(this.canMove(walkableFromLoc, VEC_D)) {
		allowed[i] = VEC_D;
		i++;
	    }
	    if(this.canMove(walkableFromLoc, VEC_L)) {
		allowed[i] = VEC_L;
		i++;
	    }
	    if(this.canMove(walkableFromLoc, VEC_R)) {
		allowed[i] = VEC_R;
		i++;
	    }
	    allowed.length = i;
	    
	    return allowed;
	}
	
	this.addApiData(rootLoc, rootData);
    };

    function _searchResultStack(resultStack, point) {
	for(var i = 0, len = resultStack.length; i < len; i++) {
	    if(resultStack[i].loc.x === point.x && resultStack[i].loc.y === point.y) {
		return i;
	    }
	}

	return -1;
    }
    
    // Given a function getNeighbors, that takes (Vector, Dist) and returns the Vectors that can be flooded to
    // This fucntion will return a list of points with their move distance
    var floodFill = function(startPoint, getNeighbors, isLeaf = undefined) {
	let searchStack = [{loc: startPoint, dist:0, prev:null}];
	let searchStackIdx = 0;

	let resultStack = [];
	let leafStack = [];
	
	while(searchStackIdx > -1) {
	    // POP
	    const curSearch = searchStack[searchStackIdx];
	    searchStackIdx--;
	    
	    // If curSearch is already on the result stack, update dist
	    let existingIndex = _searchResultStack(resultStack, curSearch.loc);
	    if(existingIndex > -1) {
		if(resultStack[existingIndex].dist > curSearch.dist) {
		    resultStack[existingIndex] = curSearch;
		} else {
		    continue;
		}
	    } else {
		resultStack.push(curSearch);
		
		if(isLeaf && isLeaf(curSearch.loc)) {
		    leafStack.push(resultStack.length-1);
		}
	    }

	    const foundCells = getNeighbors(curSearch.loc, curSearch.dist);
	    for(let i = 0, len = foundCells.length; i < len; i++) {
		// PUSH
		searchStackIdx++;
		searchStack[searchStackIdx] = {loc:foundCells[i], dist:curSearch.dist+1, prev:curSearch};
	    }
	}

	return {map:resultStack, leaves:leafStack};
    }

    // Distance from point to line, assumes the line is a ray starting at 0,0 through line
    function distanceLinePoint(line, point) {
	return Math.abs(line.y*point.x - line.x*point.y) / vector_mag(line);
    }

    // Returns a list of moves to make
    // Undefined means there are no more moves
    var getBestMove = function(mazeData, pos, exitKnown) {
	const maxFloodDist = exitKnown ? 75 : 25;
	var weightedSpace = floodFill(pos, function (fillLoc, dist) {
	    // Ignore things too many moves away
	    if(dist > maxFloodDist) {
		return [];
	    }
	    
	    let dirs = mazeData.getAvailableDirections(fillLoc);
	    let result = new Array(dirs.length);
	    for(let i = 0, len = dirs.length; i < len; i++) {
		result[i] = vector_add(fillLoc, dirs[i]);
	    }
	    return result;
	    
	}, function(fillLoc) {
	    // A loc is a leaf if we can reach it but it's unknown
	    return mazeData.getDataCode(fillLoc) === DATA_CODE_UNKNOWN;
	});
	
	// If we know where the exit is then prune leaf nodes that can not lead to the exit
	if(exitKnown) {
	    const knownSize = mazeData.getKnownSize();
	    let spaceTooBig = false;
	    let exitSpace = floodFill(knownSize, function (fillLoc, dist) {
		if(spaceTooBig || dist > 100) {
		    spaceTooBig = true;
		    return [];
		}
		
		let result = [];
		const codes = Object.keys(CELL_CODE_DIR_MAP);
		for(let i = 0, len = codes.length; i < len; i++) {
		    const dirCode = codes[i];
		    const dir = CELL_CODE_DIR_MAP[dirCode];
		    const testLoc = vector_add(fillLoc, dir);
		    const doorCode = mazeData.getDataCode(fillLoc, dir);
		    const destCode = mazeData.getDataCode(testLoc);
		    if(testLoc.x <= knownSize.x && testLoc.y <= knownSize.y && 
		       (doorCode === DATA_CODE_UNKNOWN || doorCode === DATA_CODE_FLOOR) && 
		       destCode === DATA_CODE_UNKNOWN) {
			result.push(testLoc);
		    }
		}
		
		return result;
	    }, function(fillLoc) {
		return mazeData.getAvailableDirections(fillLoc).length > 0
	    });		    
	    
	    // If we fill all possible areas, only found leaves can be the solution
	    if(!spaceTooBig) {
		let matchedLeaves = new Array(weightedSpace.leaves.length);
		let matchedLeafI = 0;
		
		for(let i = 0, wLen = weightedSpace.leaves.length; i < wLen; i++) {
		    const leafIdx = weightedSpace.leaves[i];
		    const leafLoc = weightedSpace.map[leafIdx].loc;

		    let found = false;
		    for(let j = 0, jlen = exitSpace.leaves.length; j < jlen; j++) {
			const exitLeafIdx = exitSpace.leaves[j];
			const exitLeafLoc = exitSpace.map[exitLeafIdx].loc;

			if(exitLeafLoc.x === leafLoc.x && exitLeafLoc.y === leafLoc.y) {
			    found = true;
			    break;
			}
		    }

		    if(found) {
			matchedLeaves[matchedLeafI] = leafIdx;
			matchedLeafI++;
		    }
		}

		matchedLeaves.length = matchedLeafI;
		weightedSpace.leaves = matchedLeaves;
	    }
	}

	// No possible new moves, so it is unsolvable
	if(weightedSpace.leaves.length === 0){
	    return undefined;
	}

	const diagLine = mazeData.getKnownSize();

	// Find the lowest space
	let lowestSpace = {dist: 999999999};
	for(let i = 0, len = weightedSpace.leaves.length; i < len; i++) {
	    const leafIdx = weightedSpace.leaves[i];
	    const leafLoc = weightedSpace.map[leafIdx].loc;
	    let dist;

	    if(exitKnown) {
		dist = weightedSpace.map[leafIdx].dist*10 + vector_dist(diagLine, leafLoc) * 5;
	    } else {
		dist = weightedSpace.map[leafIdx].dist * W_BACKTRACK + distanceLinePoint(diagLine, leafLoc) * W_DIAG + (diagLine.x - leafLoc.x) * W_HORIZ + leafLoc.y * W_VERT + vector_mag(leafLoc) * W_DIST;
	    }

	    if(lowestSpace.dist > dist) {
		lowestSpace = weightedSpace.map[leafIdx];
		lowestSpace.dist = dist;
	    }
	}

	// Convert the lowest space into a move path
	const movePath = []
	let prev = lowestSpace;
	while(prev) {
	    movePath.push(prev);
	    prev = prev.prev;
	}

	return movePath;
    }


    function render(mazeData) {
	let DEBUG_width = getURLParameter("width") || 50;
	let DEBUG_height = getURLParameter("height") || 100;
	let el = document.getElementById("debug");
	el.innerHTML = "";
	mazeData.buildDom(el, DEBUG_height, DEBUG_width);
	
	try {
	document.getElementById(pos.x + "_" + pos.y).className += " current";
	} catch (e) {
	}
    }

    // ----------
    // MAIN LOOP
    // ----------
    let pos = vector_new(0,0);
    let apiData = maze.getAvailableDirections();
    let mazeData = new MazeData(pos, apiData);
    let exitKnown = false;
    
    function main() {
	const movePath = getBestMove(mazeData, pos, exitKnown);
	
	// No moves means we are done
	if(movePath === undefined) {
	    maze.stop(false);
	    return false;
	}
	
	// Move to the new spot
	//moves.pop(); // Topmost move is my position
	for(let i = movePath.length - 2; i >= 0; i--) {
	    const dir = vector_sub(movePath[i].loc, pos);
	    
	    if(dir.x === 1)
		maze.moveRight();
	    if(dir.x === -1)
		maze.moveLeft();
	    if(dir.y === 1) {
		const idx = maze.currentIdx();
		maze.moveDown();
		mazeData.setKnownWidth(maze.currentIdx() - idx - 1);
	    }
	    if(dir.y === -1)
		maze.moveUp();
	    
	    pos = vector_add(pos, dir);
	    let apiData = maze.getAvailableDirections();
	    let isSolved = maze.isSolved();
	    
	    // apiData is undefined when we are done
	    if(!isSolved || apiData) {
		mazeData.addApiData(pos, apiData);
	    } else {
		return false;
	    }
	}
	
	// Change tactics if we think we found the bottom
	if(mazeData.checkForBottom(pos)) {
	    exitKnown = true;
	    
	    if(!isNode)
		console.log("EXIT IS GUESSED: " + mazeData.getKnownSize().x + "," + mazeData.getKnownSize().y);
	}
	
	return true;
    }

    if(kill > 0) {
	let count = 1;
	while(main() && count < kill) {
	    count++;
	}
    } else {
	while(main()) {}
    }
    
    if(!isNode)
	render(mazeData);
};

if(!isNode){
    thor(3.4383222646045457,-1.127262481256922,6.413781069944205,-7.411768777532894,-3.1944159216664607);
    //    thor(3.4583222646045453,-1.087262481256922,6.533781069944203,-7.451768777532894,-3.274415921666459);
} else {
    module.exports = thor;
}
