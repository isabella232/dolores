const DIR_U = "u";
const DIR_D = "d";
const DIR_L = "l";
const DIR_R = "r";

var visitedMap = {};
var upEliminated = {};
var firstDown = true;
var foundRightWall = false;
var foundBottomLeft = false;
var width = undefined;
var maxY = 0;

console.log("Starting at Pos: 0,0");
let initialPosition = {x: 0, y:0};
visit(initialPosition);
// Prevent going negative
let invalidPosition = {x: -1, y:0};
visit(invalidPosition);
var foundIt = visitNode(undefined, initialPosition, undefined);
console.log(foundIt);
maze.stop(foundIt);

function visit(pos) {
    visitedMap[pos.x + "_" + pos.y] = true;
}

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

function hasNotYetBeenVisited(pos) {
    return !visitedMap[pos.x + "_" + pos.y];
}

function canCheckUp(pos) {
    return !upEliminated[pos.x + "_" + pos.y];
}

function visitNode(parentPos, currentPos, backDirection) {

  var foundEnd = false;

  // Visit the node
  visit(currentPos);

  // check for end
  foundEnd = maze.isSolved();
  // If this is the end bail out early
  if (foundEnd || foundBottomLeft) {
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
    if (rPos.x === width && !foundRightWall) {
      foundRightWall = true;
      upEliminated = JSON.parse(JSON.stringify(visitedMap));
    }
    foundEnd = visitNode(currentPos, rPos, DIR_L);
  }
  if (availableMoves[DIR_D] && hasNotYetBeenVisited(dPos) && !foundEnd) {
    console.log("Moving D to NewPos: " + dPos.x + " " + dPos.y);
    move(DIR_D);
    // on first move down calculate the maze width
    if (firstDown) {
      width = calculateMazeWidth(currentPos);
      firstDown = false;
      console.log("Width = " + width);
    }

    if (dPos.y > maxY) {
      maxY = dPos.y;
      console.log("MayY = " + maxY);
    }

    foundEnd = visitNode(currentPos, dPos, DIR_U);
  }
  if (availableMoves[DIR_L] && hasNotYetBeenVisited(lPos) && !foundEnd) {
    console.log("Moving L to NewPos: " + lPos.x + " " + lPos.y);
    move(DIR_L);
    foundEnd = visitNode(currentPos, lPos, DIR_R);
  }
  if (availableMoves[DIR_U] && hasNotYetBeenVisited(uPos) && canCheckUp(currentPos) && !foundEnd) {
    console.log("Moving U to NewPos: " + uPos.x + " " + uPos.y);
    move(DIR_U);
    foundEnd = visitNode(currentPos, uPos, DIR_D);
  }

  if (!foundEnd && parentPos && backDirection && !foundBottomLeft) {
    if (currentPos.x === 0 && currentPos.y === maxY) {
      console.log("Found Bottom Right")
      foundBottomLeft = true;
    } else {
     console.log("Moving back " + backDirection);
     move(backDirection);
    }
   }
   return foundEnd;
}

function move(direction) {
  if (direction === "u") {
    maze.moveUp();
  } else if (direction === "r") {
    maze.moveRight();
  } else if (direction === "d") {
    maze.moveDown();
  } else if (direction === "l") {
    maze.moveLeft();
  }
}

function calculateMazeWidth(currentPosition) {
  var index = maze.currentIdx();
  var width = index - currentPosition.x - 1;
  return width;
}
