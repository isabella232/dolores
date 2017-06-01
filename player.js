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
function visit(pos) {
    visitedMap[pos.x + "_" + pos.y] = true;
}
function hasNotYetBeenVisited(pos) {
    return !visitedMap[pos.x + "_" + pos.y];
}

function visitNode(parentPos, currentPos) {

  foundEnd = false;

  // Visit the node
  visit(currentPos);

  // check for end
  foundEnd = maze.isSolved();
  // If this is the end bail out early
  if (foundEnd) {
    return foundEnd
  }

  // Get possible new positions
  let availableMoves = maze.getAvailableDirections();
  let rPos = createNewPos(currentPos, DIR_R);
  let dPos = createNewPos(currentPos, DIR_D);
  let lPos = createNewPos(currentPos, DIR_L);
  let uPos = createNewPos(currentPos, DIR_U);

  if (availableMoves[DIR_R] && hasNotYetBeenVisited(rPos) && !foundEnd) {
    console.log("Moving to NewPos: " + rPos.x + " " + rPos.y);
    move(DIR_R);
    foundEnd = visitNode(currentPos, rPos);
  }
  if (availableMoves[DIR_D] && hasNotYetBeenVisited(dPos) && !foundEnd) {
    console.log("Moving to NewPos: " + dPos.x + " " + dPos.y);
    move(DIR_D);
    foundEnd = visitNode(currentPos, dPos);
  }
  if (availableMoves[DIR_L] && hasNotYetBeenVisited(lPos) && !foundEnd) {
    console.log("Moving to NewPos: " + lPos.x + " " + lPos.y);
    move(DIR_L);
    foundEnd = visitNode(currentPos, lPos);
  }
  if (availableMoves[DIR_U] && hasNotYetBeenVisited(uPos) && !foundEnd) {
    console.log("Moving to NewPos: " + uPos.x + " " + uPos.y);
    move(DIR_U);
    foundEnd = visitNode(currentPos, uPos);
  }

  if (!foundEnd && parentPos) {
	   var dirCodeBack = dirCodeBetweenNodes(currentPos, parentPos);
	   // Return to parent
     console.log("Moving back");
     move(dirCodeBack);
   }
   return foundEnd;
}

function move(code) {
  if (code === "u") {
    maze.moveUp();
  } else if (code === "r") {
    maze.moveRight();
  } else if (code === "d") {
    maze.moveDown();
  } else if (code === "l") {
    maze.moveLeft();
  }
}

console.log("Starting at Pos: 0,0");
var foundIt = visitNode(undefined, {x: 0, y:0});
console.log(foundIt);
maze.stop(foundIt);
