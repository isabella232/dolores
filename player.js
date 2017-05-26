var visitedNodes = {};
var rootNode;
var currentPosition = {x: 0, y: 0};

const DIR_U = "u";
const DIR_D = "d";
const DIR_L = "l";
const DIR_R = "r";

const MOVE_FUNC = {
    'u': 'moveUp',
    'd': 'moveDown',
    'l': 'moveLeft',
    'r': 'moveRight'
};

function addVector(a, b) {
    return {x: a.x + b.x, y: a.y + b.y};
}
function createNewPos(pos, dirCode) {
    if(dirCode === DIR_R) {
	return addVector(pos, {x: 1, y: 0});
    }
    if(dirCode === DIR_L) {
	return addVector(pos, {x: -1, y: 0});
    }
    if(dirCode === DIR_U) {
	return addVector(pos, {x: 0, y: -1});
    }
    if(dirCode === DIR_D) {
	return addVector(pos, {x: 0, y: 1});
    }
}
function dirCodeBetweenNodes(fromNode, toNode) {
    console.log("From " + fromNode.x + " " + fromNode.y + " TO " + toNode.x + " " + toNode.y);

    if(toNode.x - fromNode.x === 1) {
	return DIR_R;
    }
    if(toNode.x - fromNode.x === -1) {
	return DIR_L;
    }
    if(toNode.y - fromNode.y === 1) {
	return DIR_U;
    }
    if(toNode.y - fromNode.y === -1) {
	return DIR_D;
    }
}

var visitedMap = {};
function setWasVisited(pos) {
    visitedMap[pos.x + "_" + pos.y] = true;
}
function wasVisited(pos) {
    return visitedMap[pos.x + "_" + pos.y];
}

function visitNode(parentPos, currentPos) {
    var foundEnd = false;

    // Visit the node
    setWasVisited(currentPos);

    // check for end
    if (maze.isSolved()) {
	foundEnd = true;
    } else {
	let availableMoves = maze.getAvailableDirections();

	for (let code in availableMoves) {
	    let currentDirection = availableMoves[code];
            let newPos = createNewPos(currentPosition, code);

	    console.log("Cur: " + currentPos.x + " " + currentPos.y + " CODE: " + code + " NewPos: " + newPos.x + " " + newPos.y);

	    if (currentDirection && !wasVisited(newPos)) {
		// Move to node we are about to visit
		maze[MOVE_FUNC[code]]();

		foundEnd = visitNode(currentPos, newPos);
		if (foundEnd) {
		    break; // we found the end return
		}
	    }
	}
    }

    if (!foundEnd && parentPos) {
	var dirCodeBack = dirCodeBetweenNodes(currentPos, parentPos);
	// Return to parent
	maze[MOVE_FUNC[dirCodeBack]]();
    }
    return foundEnd;
}    

var foundIt = visitNode(undefined, {x: 0, y:0});
console.log(foundIt);