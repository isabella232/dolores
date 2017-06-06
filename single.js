// Run once
if(typeof performance === 'undefined') {
    performance = {};
    performance.now = function() {
	let time = process.hrtime();
	return Math.round((time[0]*1000) + (time[1]/1000000));
    }
}

var mazeMethods = require('./maze.js');
var maze = mazeMethods.maze;
var initializeMaze = mazeMethods.initializeMaze;
var thor = require('./thor.js');


const SEEDS = [49519, 86412, 37506, 30431, 74289];
const len = SEEDS.length;

const WIDTH = 50;
const HEIGHT = 100;

let totalTime = 0;
let totalMoves = 0;

for(let i = 0; i < len; i++) {
    // Build the maze
    initializeMaze(SEEDS[i], HEIGHT, WIDTH);
    
    // Measure runtime
    let startTime = performance.now();
    //thor(2, 4, 0, -2, -2);
    thor(-7.232410000517487, -8.700569333742738, -4.293919852407576, 4.872625915080311, 9.212478345607188);
    totalTime += (performance.now() - startTime);
    totalMoves +=  maze.moveCount();
}
    
// Record
console.log("Time: " + totalTime/len);
console.log("Moves: " + totalMoves/len);
