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

var visitedMap = {};
function visit(pos) {
    visitedMap[pos.x + "_" + pos.y] = true;
}
function hasNotYetBeenVisited(pos) {
    return !visitedMap[pos.x + "_" + pos.y];
}

function visitNode(parentPos, currentPos, backDirection) {

  var foundEnd = false;

  // Visit the node
  visit(currentPos);

  // check for end
  foundEnd = maze.isSolved();
  // If this is the end bail out early
  if (foundEnd) {
    return foundEnd
  }

  // Get possible new positions
  var availableMoves = maze.getAvailableDirections();
  var rPos = createNewPos(currentPos, DIR_R);
  var dPos = createNewPos(currentPos, DIR_D);
  var lPos = createNewPos(currentPos, DIR_L);
  var uPos = createNewPos(currentPos, DIR_U);

  if (availableMoves[DIR_R] && hasNotYetBeenVisited(rPos) && !foundEnd) {
    console.log("Moving R to NewPos: " + rPos.x + " " + rPos.y);
    move(DIR_R);
    foundEnd = visitNode(currentPos, rPos, DIR_L);
  }
  if (availableMoves[DIR_D] && hasNotYetBeenVisited(dPos) && !foundEnd) {
    console.log("Moving D to NewPos: " + dPos.x + " " + dPos.y);
    move(DIR_D);
    foundEnd = visitNode(currentPos, dPos, DIR_U);
  }
  if (availableMoves[DIR_L] && hasNotYetBeenVisited(lPos) && !foundEnd) {
    console.log("Moving L to NewPos: " + lPos.x + " " + lPos.y);
    move(DIR_L);
    foundEnd = visitNode(currentPos, lPos, DIR_R);
  }
  if (availableMoves[DIR_U] && hasNotYetBeenVisited(uPos) && !foundEnd) {
    console.log("Moving U to NewPos: " + uPos.x + " " + uPos.y);
    move(DIR_U);
    foundEnd = visitNode(currentPos, uPos, DIR_D);
  }

  if (!foundEnd && parentPos && backDirection) {
     console.log("Moving back " + backDirection);
     move(backDirection);
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
let initialPosition = {x: 0, y:0};
visit(initialPosition);
// Prevent going negative
let invalidPosition = {x: -1, y:0};
visit(invalidPosition);
var foundIt = visitNode(undefined, initialPosition, undefined);
console.log(foundIt);
maze.stop(foundIt);
