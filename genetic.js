if(typeof performance === 'undefined') {
    performance = {};
    performance.now = function() {
	let time = process.hrtime();
	return time[0] + time[1] / 1000000000;
    }
}

var display = (function() {
	var write;
	var log;
	var logAgain;

	var timestamp = (new Date()).getTime();
	var fs = require('fs');

	if(fs) {
	    log = function (msg) { process.stdout.write(msg + '\n'); };

	    write = function(msg) {
		log(msg);
		fs.appendFileSync('ga_output_' + timestamp + '.txt', msg + '\n');
	    };

	    logAgain = function (msg) {
		process.stdout.write('\33[2K\r' + msg);
	    };
	} else {
	    write = console.log;
	    log = console.log;
	    logAgain = console.log;
	}
	
	return {
	    "save": write,
	    log: log,
	    logAgain: logAgain
	};
    })();

// Evolve the correct weights!
(function() {
    const MIN_SIZE = 20;
    const MIN_MOVES = 40; // Less than 40 moves is invalid map type
    const MAX_SIZE = 250;

    const WEIGHT_MAX = 10;
    const WEIGHT_MIN = -10;

    const RUN_COUNT = 10;
    const SELECTION_SIZE = 10;
    const GENERATION_SIZE = SELECTION_SIZE * SELECTION_SIZE; // Every parent mates with every other parent (eww)
    const MUTATION = 0.01;

    const WEIGHT_COUNT = 5;

    // Create a completely random child
    function createWeights() {
	let weights = [];
	for(let i = 0; i < WEIGHT_COUNT; i++){
	    weights.push(Math.random() * (WEIGHT_MAX - WEIGHT_MIN) + WEIGHT_MIN);
	}
	return weights;
    }

    // Use uniform crossover to generate random child
    function mixWeights(parentA, parentB) {
	let weights = [];
        for(let i = 0; i < WEIGHT_COUNT; i++){
	    let weight = Math.random() < 0.5 ? parentA[i] : parentB[i];
	    weight    += Math.random() < 0.5 ? +MUTATION  : -MUTATION;
	    
	    weights.push(weight);
        }
        return weights;
    }

    function runMaze(seed, width, height, child) {
	let mazeMethods = require('./maze.js');
	let maze = mazeMethods.maze;
	let initializeMaze = mazeMethods.initializeMaze;
	let thor = require('./thor.js');

	initializeMaze(seed, height, width);
	thor(child[0], child[1], child[2], child[3], child[4], 10000);

	return maze.moveCount();
    }

    // Given an array of weight combinations
    // Return them sorted by fitness score
    function runGeneration(children) {
	// Run them through multiple mazes
	for(let i = 0; i < RUN_COUNT; i++) {
	    let seed = Math.floor(Math.random() * 1000000);
	    let height = Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE);
	    let width = Math.floor(Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE);
	    
	    display.save("RUN: " + i + " Seed: " + seed + " [" + width + "," + height + "]");
	    let startTime = performance.now();

	    for(let j = 0; j < children.length; j++){
		let child = children[j];
		const moves = runMaze(seed, width, height, child);

		if(child.moves === undefined)
		    child.moves = 0;
		
		child.moves += (moves / (width * height)) * 100;

		display.logAgain(" [" + (1+j) + "/" + children.length + "] M[" + moves + "] W[" + child[0] + ", " + child[1] + ", " +child[2] + ", "+ child[3] + ", " + child[4] + "]");
	    }

	    display.logAgain("");
	    display.save(" Time: " + (performance.now() - startTime));
	}

	// Average their moves
	for(let i in children) {
	    let child = children[i];

	    child.moves = child.moves / RUN_COUNT;
	}

	children.sort(function(a, b){
		return a.moves - b.moves;
	    });

	return children;
    }

    // --------
    // MAIN
    // ---------
    function evolve() {
	display.save("Starting GA");
	var children = [];

	// Create a starting population
	for(let i = 0; i < GENERATION_SIZE; i++){
	    children.push(createWeights());
	}
	display.log("Created Inital Population: " + GENERATION_SIZE);

	for(let generation = 0; generation < 1000; generation++){
	    display.save("Starting generation " + generation);

	    // Get fitness values
	    let startTime = performance.now();
	    runGeneration(children);
	    let endTime = performance.now();	    

	    // Take the best ones
	    let parents = [];
	    for(let i = 0; i < SELECTION_SIZE; i++){
		parents.push(children[i]);
	    }
	    
	    display.save("Generation: " + generation + " Time: " + (endTime - startTime));
	    display.save("Moves:" + children[0].moves + ", Best: " + JSON.stringify(children[0]));

	    children = [];
	    for(let i in parents) {
		for(let j in parents) {
		    children.push(mixWeights(parents[i], parents[j]));
		}
	    }
	}

    }
    evolve();
	/*
	  console.log("Map: " + seed + " [" + width + "," + height + "]");
	  console.log("Time taken: " + (endTime - startTime) / 1000 + "s");       
	  console.log("Moves: " + maze.moveCount());
	*/

})();
