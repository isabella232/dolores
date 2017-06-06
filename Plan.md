Data storage
------------
- 2d array
- every other block is a floor surrounded by doors/walls

When navigating the data do so by moving 2 blocks at a time. Possible moves are represented by a neighboring block being a "door". Invalid moves are "wall" or "locked".

Locked represents a possible move that has been deemed pointless (island).

Choosing A Move
---------------
Minimizing moves is the only criteria, so pick the next best move by weighing wasted moves vs closeness (ROI).

`weight = distToExit + movesToReach * C`

- distToExit: normal sqrt(x^2 + y^2) distance from destination block after moving through door to exit.
- movesToReach: number of moves needed to reach the door (not including the move through the door)
- C: Some coefficeant that must be found via testing

Identifing Islands
------------------
An island is a bit of map that can not help us reach the goal. It is defined as a set of doors that can not possibly be the solution.

1. Start at exit
2. Flood fill unknown spaces, assuming they have 4 doors
3. All doors that do not touch the flood fill are part of an island. Mark them "locked" and ignore them

Solver Algorithm
----------------

1. If no doors then map unsolvable
2. Find the lowest weight door.
3. Move to door (repeat here until reached).
4. Move through door
5. Identify islands and remove invalid doors
6. GoTo 1.

