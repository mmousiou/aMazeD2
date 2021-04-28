/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Maze game.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Maze');

goog.require('Blockly.FieldDropdown');
goog.require('Blockly.Trashcan');
goog.require('Blockly.utils.dom');
goog.require('Blockly.utils.math');
goog.require('Blockly.utils.string');
goog.require('Blockly.VerticalFlyout');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Maze.Blocks');
goog.require('Maze.soy');


BlocklyGames.NAME = 'maze';

//Το παιχνίδι έχει 6 επίπεδα


/**
 * Go to the next level.  Add skin parameter.
 * @suppress {duplicate}
 */

//άλλαξα το nextLevel για να σε στέλντει μετά το 6ο level στο turtle, αφαίρεσα από παντού το BocklyGames.maxlevel 
BlocklyInterface.nextLevel = function() {
    if (BlocklyGames.LEVEL < 6) {
        window.location = window.location.protocol + '//' +
            window.location.host + window.location.pathname +
            '?lang=' + BlocklyGames.LANG + '&level=' + (BlocklyGames.LEVEL + 1) +
            '&skin=' + Maze.SKIN_ID;
    } else if (BlocklyGames.LEVEL == 6) {
        BlocklyInterface.turtlePage();
    }
};

// =================Choose how many blocks are left , Infinity for no restrictions =============
Maze.MAX_BLOCKS = [undefined, // Level 0.
    Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity
][BlocklyGames.LEVEL];

// Crash type constants.
Maze.CRASH_STOP = 1;
Maze.CRASH_SPIN = 2;
Maze.CRASH_FALL = 3;

Maze.SKINS = [
    // sprite: A 1029x51 set of 21 avatar images.
    // tiles: A 250x200 set of 20 map images.
    // marker: A 20x34 goal image.
    // background: An optional 400x450 background image, or false.
    // look: Colour of sonar-like look icon.
    // winSound: List of sounds (in various formats) to play when the player wins.
    // crashSound: List of sounds (in various formats) for player crashes.
    // crashType: Behaviour when player crashes (stop, spin, or fall).

    // changed first sprite to astronaut

    {
        sprite: 'maze/astro.png',
        avatar: 'maze/astro.png',
        tiles: 'maze/tiles_astro2.png',
        marker: 'maze/rocket_marker.png',
        background: 'maze/bg_astro2.png',
        look: '#fff',
        winSound: ['maze/win.mp3', 'maze/win.ogg'],
        crashSound: ['maze/fail_astro.mp3', 'maze/fail_astro.ogg'],
        crashType: Maze.CRASH_SPIN
    }, {
        sprite: 'maze/zombie.png',
        avatar: 'maze/zombie.png',
        tiles: 'maze/tiles_zombie.png',
        marker: 'maze/marker_flower.png',
        background: 'maze/bg_zombie.png',
        // Coma star cluster, photo by George Hatfield, used with permission.
        look: '#fff',
        winSound: ['maze/win_zombie.mp3', 'maze/win_zombie.ogg'],
        crashSound: ['maze/fail_zombie.mp3', 'maze/fail_zombie.ogg'],
        crashType: Maze.CRASH_STOP
    },
    {
        sprite: 'maze/bee2.png',
        avatar: 'maze/static_bee2.png',
        tiles: 'maze/tiles_bee.png',
        marker: 'maze/marker_honey.png',
        background: 'maze/bg_bee.png',
        look: '#000',
        winSound: ['maze/win.mp3', 'maze/win.ogg'],
        crashSound: ['maze/fail_panda.mp3', 'maze/fail_panda.ogg'],
        crashType: Maze.CRASH_FALL
    }
];
Maze.SKIN_ID = BlocklyGames.getNumberParamFromUrl('skin', 0, Maze.SKINS.length);
Maze.SKIN = Maze.SKINS[Maze.SKIN_ID];

//για να επιλεχθεί το σωστό level-skin στο όταν φορτώνει

for (var i = 0; i < 6; i++) {
    if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME, i + 1)) {
        BlocklyGames.LEVEL = i + 1;
        break;
        // αν και το τελευταίο επίπεδο έχει ολοκληρωθεί τότε θα εμφανιστεί μήνυμα ολοκλήρωσης παιχνιδιού (ο κώδικας είναι εκτός της συνάρτησης στο if για τις οδηγίες του τελευταίου επιπέδου) , αν δεν βάλουμε τη συνθήκη που ακολουθεί πέφτει σε λούπα
    } else if (!!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME, 6)) {
        BlocklyGames.LEVEL = 6;
    }
}

/**
 * Milliseconds between each animation frame.
 */
Maze.stepSpeed;

/**
 * The types of squares in the maze, which is represented
 * as a 2D array of SquareType values.
 * @enum {number}
 */
Maze.SquareType = {
    WALL: 0,
    OPEN: 1,
    START: 2,
    FINISH: 3,
    OBSTACLE: 4,
    LOOP: 5
};

// The maze square constants defined above are inlined here
// for ease of reading and writing the static mazes.
Maze.map = [
    // Level 0.
    undefined,
    // Level 1.
    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 3, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 2, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // Level 2.
    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 2, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 3]
    ],
    // Level 3.
    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 2, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 3, 0, 0, 0, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // Level 4.
    /**
     * Note, the path continues past the start and the goal in both directions.
     * This is intentionally done so users see the maze is about getting from
     * the start to the goal and not necessarily about moving over every part of
     * the maze, 'mowing the lawn' as Neil calls it.
     */
    [
        [0, 0, 0, 0, 4, 0, 0, 0],
        [0, 0, 2, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 4],
        [0, 0, 3, 0, 0, 0, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 4, 0, 0, 0, 0]
    ],
    // Level 5.
    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 3, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 2, 1, 1, 1, 0, 0, 0]
    ],
    // Level 6.
    [
        [0, 0, 0, 3, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [2, 1, 1, 1, 1, 0, 0, 0]
    ],
][BlocklyGames.LEVEL];

/**
 * Measure maze dimensions and set sizes.
 * ROWS: Number of tiles down.
 * COLS: Number of tiles across.
 * SQUARE_SIZE: Pixel height and width of each maze square (i.e. tile).
 */
Maze.ROWS = Maze.map.length;
Maze.COLS = Maze.map[0].length;
Maze.SQUARE_SIZE = 50;
Maze.PEGMAN_HEIGHT = 52;
Maze.PEGMAN_WIDTH = 49;

Maze.MAZE_WIDTH = Maze.SQUARE_SIZE * Maze.COLS;
Maze.MAZE_HEIGHT = Maze.SQUARE_SIZE * Maze.ROWS;
Maze.PATH_WIDTH = Maze.SQUARE_SIZE / 3;

/**
 * Αντικείμενο με δεδομένα για κάθε επίπεδο
 *  
 */
Maze.levelData = [{
        name: "Επίπεδο 1",
        countPlay: 0,
        time: "0",
        result: "",
        score: 0,
    },
    {
        name: "Επίπεδο 2",
        countPlay: 0,
        time: "0",
        result: "",
        score: 0,
    },
    {
        name: "Επίπεδο 3",
        countPlay: 0,
        time: "0",
        result: "",
        score: 0,
    },
    {
        name: "Επίπεδο 4",
        countPlay: 0,
        time: "0",
        result: "",
        score: 0,
    },
    {
        name: "Επίπεδο 5",
        countPlay: 0,
        time: "0",
        result: "",
        score: 0,
    },
    {
        name: "Επίπεδο 6",
        countPlay: 0,
        time: "0",
        result: "",
        score: 0,
    },
];

var totalScore = 0;
/**
 * Constants for cardinal directions.  Subsequent code assumes these are
 * in the range 0..3 and that opposites have an absolute difference of 2.
 * @enum {number}
 */
Maze.DirectionType = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
};

/**
 * Outcomes of running the user program.
 */
Maze.ResultType = {
    UNSET: 0,
    SUCCESS: 1,
    FAILURE: -1,
    TIMEOUT: 2,
    ERROR: -2
};

/**
 * Result of last execution.
 */
Maze.result = Maze.ResultType.UNSET;

/**
 * Starting direction.
 */
Maze.startDirection = Maze.DirectionType.EAST;

/**
 * PIDs of animation tasks currently executing.
 */
Maze.pidList = [];

// Map each possible shape to a sprite.
// Input: Binary string representing Centre/North/West/South/East squares.
// Output: [x, y] coordinates of each tile's sprite in tiles.png.
Maze.tile_SHAPES = {
    '10010': [4, 0], // Dead ends
    '10001': [3, 3],
    '11000': [0, 1],
    '10100': [0, 2],
    '11010': [4, 1], // Vertical
    '10101': [3, 2], // Horizontal
    '10110': [0, 0], // Elbows
    '10011': [2, 0],
    '11001': [4, 2],
    '11100': [2, 3],
    '11110': [1, 1], // Junctions
    '10111': [1, 0],
    '11011': [2, 1],
    '11101': [1, 2],
    '11111': [2, 2], // Cross
    'null0': [4, 3], // Empty
    'null1': [3, 0],
    'null2': [3, 1],
    'null3': [0, 3],
    'null4': [1, 3]
};

/**
 * Create and layout all the nodes for the path, scenery, Pegman, and goal.
 */
Maze.drawMap = function() {
    var svg = document.getElementById('svgMaze');
    var scale = Math.max(Maze.ROWS, Maze.COLS) * Maze.SQUARE_SIZE;
    svg.setAttribute('viewBox', '0 0 ' + scale + ' ' + scale);

    // Draw the outer square.
    Blockly.utils.dom.createSvgElement('rect', {
        'height': Maze.MAZE_HEIGHT,
        'width': Maze.MAZE_WIDTH,
        'fill': '#F1EEE7',
        'stroke-width': 1,
        'stroke': '#CCB'
    }, svg);

    if (Maze.SKIN.background) {
        var tile = Blockly.utils.dom.createSvgElement('image', {
            'height': Maze.MAZE_HEIGHT,
            'width': Maze.MAZE_WIDTH,
            'x': 0,
            'y': 0
        }, svg);
        tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
            Maze.SKIN.background);
    }

    // Draw the tiles making up the maze map.

    // Return a value of '0' if the specified square is wall or out of bounds,
    // '1' otherwise (empty, start, finish).
    var normalize = function(x, y) {
        if (x < 0 || x >= Maze.COLS || y < 0 || y >= Maze.ROWS) {
            return '0';
        }
        return (Maze.map[y][x] == Maze.SquareType.WALL) ? '0' : '1';
    };

    // Compute and draw the tile for each square.
    var tileId = 0;
    for (var y = 0; y < Maze.ROWS; y++) {
        for (var x = 0; x < Maze.COLS; x++) {
            // Compute the tile shape.
            var tileShape = normalize(x, y) +
                normalize(x, y - 1) + // North.
                normalize(x + 1, y) + // West.
                normalize(x, y + 1) + // South.
                normalize(x - 1, y); // East.

            // Draw the tile.
            if (!Maze.tile_SHAPES[tileShape]) {
                // Empty square.  Use null0 for large areas, with null1-4 for borders.
                // Add some randomness to avoid large empty spaces.
                if (tileShape == '00000' && Math.random() > 0.3) {
                    tileShape = 'null0';
                } else {
                    tileShape = 'null' + Math.floor(1 + Math.random() * 4);
                }
            }
            var left = Maze.tile_SHAPES[tileShape][0];
            var top = Maze.tile_SHAPES[tileShape][1];
            // Tile's clipPath element.
            var tileClip = Blockly.utils.dom.createSvgElement('clipPath', {
                'id': 'tileClipPath' + tileId
            }, svg);
            Blockly.utils.dom.createSvgElement('rect', {
                'height': Maze.SQUARE_SIZE,
                'width': Maze.SQUARE_SIZE,
                'x': x * Maze.SQUARE_SIZE,
                'y': y * Maze.SQUARE_SIZE
            }, tileClip);
            // Tile sprite.
            var tile = Blockly.utils.dom.createSvgElement('image', {
                'height': Maze.SQUARE_SIZE * 4,
                'width': Maze.SQUARE_SIZE * 5,
                'clip-path': 'url(#tileClipPath' + tileId + ')',
                'x': (x - left) * Maze.SQUARE_SIZE,
                'y': (y - top) * Maze.SQUARE_SIZE
            }, svg);
            tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
                Maze.SKIN.tiles);
            tileId++;
        }
    }

    // Add finish marker.
    var finishMarker = Blockly.utils.dom.createSvgElement('image', {
        'id': 'finish',
        'height': 44, //34,20
        'width': 30
    }, svg);
    finishMarker.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
        Maze.SKIN.marker);

    // Pegman's clipPath element, whose (x, y) is reset by Maze.displayPegman
    var pegmanClip = Blockly.utils.dom.createSvgElement('clipPath', {
        'id': 'pegmanClipPath'
    }, svg);
    Blockly.utils.dom.createSvgElement('rect', {
        'id': 'clipRect',
        'height': Maze.PEGMAN_HEIGHT,
        'width': Maze.PEGMAN_WIDTH
    }, pegmanClip);

    // Add Pegman.
    var pegmanIcon = Blockly.utils.dom.createSvgElement('image', {
        'id': 'pegman',
        'height': Maze.PEGMAN_HEIGHT,
        'width': Maze.PEGMAN_WIDTH * 21, // 49 * 21 = 1029
        'clip-path': 'url(#pegmanClipPath)'
    }, svg);
    pegmanIcon.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
        Maze.SKIN.sprite);
};
/**
 * Timer πρώτη προσπάθεια
 */

Maze.setTimerLevel = function() {
    var tick = function() {
        var min = String(Math.trunc(time / 60)).padStart(2, 0);
        var sec = String(time % 60).padStart(2, 0);
        // In each call, print the remaining time to UI
        document.getElementById('capacity').textContent = min + ":" + sec;
        time++;
    };
    // Set time to 5 minutes
    var time = 0;

    // Call the timer every second
    tick();
    timer = setInterval(tick, 1000);

    return timer;
}

var timer;


/**
 * Initialize Blockly and the maze.  Called on page load.
 */

Maze.init = function() {

    // Render the Soy template.
    document.body.innerHTML = Maze.soy.start({}, null, {
        lang: BlocklyGames.LANG,
        level: BlocklyGames.LEVEL,
        maxLevel: 10,
        skin: Maze.SKIN_ID,
        html: BlocklyGames.IS_HTML
    });

    //put timer 
    if (timer) clearInterval(timer);
    timer = Maze.setTimerLevel();



    //κώδικας για να έχω το score από προηγούμενα επίπεδα
    // if (window.localStorage.totalScore) {
    //     document.querySelector(".outcome__value--total__score").textContent = window.localStorage.totalScore;
    // } else {
    //     window.localStorage.totalScore = 0;
    //     document.querySelector(".outcome__value--total__score").textContent = window.localStorage.totalScore;
    // }

    var data1 = JSON.parse(window.localStorage.getItem("maze_level1"));
    var data2 = JSON.parse(window.localStorage.getItem("maze_level2"));
    var data3 = JSON.parse(window.localStorage.getItem("maze_level3"));
    var data4 = JSON.parse(window.localStorage.getItem("maze_level4"));
    var data5 = JSON.parse(window.localStorage.getItem("maze_level5"));
    var data6 = JSON.parse(window.localStorage.getItem("maze_level6"));


    if (data1) Maze.levelData[0] = data1;
    if (data2) Maze.levelData[1] = data2;
    if (data3) Maze.levelData[2] = data3;
    if (data4) Maze.levelData[3] = data4;
    if (data5) Maze.levelData[4] = data5;
    if (data6) Maze.levelData[5] = data6;


    console.log(Maze.levelData);
    totalScore = Maze.levelData[0].score +
        Maze.levelData[1].score + Maze.levelData[2].score + Maze.levelData[3].score + Maze.levelData[4].score + Maze.levelData[5].score;
    window.localStorage.setItem('total-score', totalScore);
    document.querySelector(".outcome__value--total__score").textContent = window.localStorage.getItem('total-score');


    BlocklyInterface.init();

    // Setup the Pegman menu.
    var pegmanImg = document.querySelector('#pegmanButton>img');
    pegmanImg.style.backgroundImage = 'url(' + Maze.SKIN.avatar + ')';
    var pegmanMenu = document.getElementById('pegmanMenu');
    var handlerFactory = function(n) {
        return function() {
            Maze.changePegman(n);

        };
    };
    for (var i = 0; i < Maze.SKINS.length; i++) {
        if (i == Maze.SKIN_ID) {
            continue;
        }
        var div = document.createElement('div');
        var img = document.createElement('img');
        img.src = 'common/1x1.gif';
        img.style.backgroundImage = 'url(' + Maze.SKINS[i].avatar + ')';
        div.appendChild(img);
        pegmanMenu.appendChild(div);
        Blockly.bindEvent_(div, 'mousedown', null, handlerFactory(i));
    }
    Blockly.bindEvent_(window, 'resize', null, Maze.hidePegmanMenu);
    var pegmanButton = document.getElementById('pegmanButton');
    Blockly.bindEvent_(pegmanButton, 'mousedown', null, Maze.showPegmanMenu);
    var pegmanButtonArrow = document.getElementById('pegmanButtonArrow');
    var arrow = document.createTextNode(Blockly.FieldDropdown.ARROW_CHAR);
    pegmanButtonArrow.appendChild(arrow);

    var rtl = BlocklyGames.isRtl();
    var blocklyDiv = document.getElementById('blockly');
    var visualization = document.getElementById('visualization');
    var onresize = function(e) {
        var top = visualization.offsetTop;
        blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
        blocklyDiv.style.left = rtl ? '10px' : '420px';
        blocklyDiv.style.width = (window.innerWidth - 440) + 'px';
    };
    window.addEventListener('scroll', function() {
        onresize(null);
        Blockly.svgResize(BlocklyInterface.workspace);
    });
    window.addEventListener('resize', onresize);
    onresize(null);

    // Scale the workspace so level 1 = 1.3, and level 10 = 1.0.
    // έβγαλα από το zoom   { 'startScale': scale }
    // var scale = 1 + (1 - (BlocklyGames.LEVEL / BlocklyGames.MAX_LEVEL)) / 3;
    BlocklyInterface.injectBlockly({
        'maxBlocks': Maze.MAX_BLOCKS,
        'rtl': rtl,
        'trashcan': true,
        'zoom': true
    });
    BlocklyInterface.workspace.getAudioManager().load(Maze.SKIN.winSound, 'win');
    BlocklyInterface.workspace.getAudioManager().load(Maze.SKIN.crashSound, 'fail');
    // Not really needed, there are no user-defined functions or variables.
    Blockly.JavaScript.addReservedWords('moveForward,moveBackward,' +
        'turnRight,turnLeft,isPathForward,isPathRight,isPathBackward,isPathLeft');

    Maze.drawMap();


    // Locate the start and finish squares.
    for (var y = 0; y < Maze.ROWS; y++) {
        for (var x = 0; x < Maze.COLS; x++) {
            if (Maze.map[y][x] == Maze.SquareType.START) {
                Maze.start_ = { x: x, y: y };
                //το επόμενο if else δημιουργεί κλειστή διαδρομή
            } else if (Maze.map[y][x] == Maze.SquareType.LOOP) {
                Maze.start_ = { x: x, y: y };
                Maze.finish_ = { x: x, y: y };
            } else if (Maze.map[y][x] == Maze.SquareType.FINISH) {
                Maze.finish_ = { x: x, y: y };
            } else if (Maze.map[y][x] == Maze.SquareType.OBSTACLE) {
                Maze.result = Maze.ResultType.FAILURE;
            }
        }
    }

    Maze.reset(true);
    BlocklyInterface.workspace.addChangeListener(function() { Maze.updateCapacity(); });

    document.body.addEventListener('mousemove', Maze.updatePegSpin_, true);

    BlocklyGames.bindClick('runButton', Maze.runButtonClick);
    BlocklyGames.bindClick('resetButton', Maze.resetButtonClick);
    //submit button
    BlocklyGames.bindClick('submitButton', Maze.submitButtonClick);

    //=========================================================================================================
    //Εμφάνιση οδηγιών πάνω από τον λαβύρινθο
    // Εμφάνιση διαλόγου "Το επίπεδο ολοκληρώθηκε" -- δεν χρειάζεται πια γιατί δεν μπορώ να γυρίσω σε προηγούμενο επίπεδο που έχει ολοκληρωθεί!!

    if (BlocklyGames.LEVEL == 1) {
        if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                BlocklyGames.LEVEL)) {
            // Level gets an introductory modal dialog.
            // Skip the dialog if the user has already won.
            document.querySelector(".header-help").textContent = document.getElementById('dialogHelpLevel1').textContent;
        } else {
            BlocklyInterface.nextLevel();
        }
    }

    if (BlocklyGames.LEVEL == 2) {
        if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                BlocklyGames.LEVEL)) {
            // Level 10 gets an introductory modal dialog.
            // Skip the dialog if the user has already won.
            document.querySelector(".header-help").textContent = document.getElementById('dialogHelpLevel2').textContent;

        }
    }

    if (BlocklyGames.LEVEL == 3) {
        if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                BlocklyGames.LEVEL)) {
            // Level 10 gets an introductory modal dialog.
            // Skip the dialog if the user has already won.
            document.querySelector(".header-help").textContent = document.getElementById('dialogHelpLevel3').textContent;

        }
    }

    if (BlocklyGames.LEVEL == 4) {
        if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                BlocklyGames.LEVEL)) {
            // Level 10 gets an introductory modal dialog.
            // Skip the dialog if the user has already won.
            document.querySelector(".header-help").textContent = document.getElementById('dialogHelpLevel4').textContent;

        }
    }
    if (BlocklyGames.LEVEL == 5) {
        if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                BlocklyGames.LEVEL)) {
            // Level 10 gets an introductory modal dialog.
            // Skip the dialog if the user has already won.
            document.querySelector(".header-help").textContent = document.getElementById('dialogHelpLevel5').textContent;
        }
    }
    if (BlocklyGames.LEVEL == 6) {
        if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                BlocklyGames.LEVEL)) {
            // Level 10 gets an introductory modal dialog.
            // Skip the dialog if the user has already won.
            document.querySelector(".header-help").textContent = document.getElementById('dialogHelpLevel6').textContent;
        } else {
            // //εντολή else για τελευταίο επίπεδο! 
            // var content = document.getElementById('dialogMazeDone');
            // var style = {
            //     'width': '30%',
            //     'left': '35%',
            //     'top': '12em'
            // };
            // BlocklyDialogs.showDialog(content, null, false, true, style,
            //     BlocklyDialogs.stopDialogKeyDown);
            // BlocklyDialogs.startDialogKeyDown();
            // //περίμενε 1 δευτερόλεπτα και άλλαξε level
            setTimeout(BlocklyInterface.turtlePage, 1000);
        }
    }

    //======================================================================================================

    // Περιμένουμε 5 δευτερόλεπτα για το maze level help
    //All other levels get interactive help.  But wait 5 seconds for the
    // user to think a bit before they are told what to do.
    setTimeout(function() {
        BlocklyInterface.workspace.addChangeListener(Maze.levelHelp);
        Maze.levelHelp();
    }, 2000);


    // Add the spinning Pegman icon to the done dialog.
    // <img id="pegSpin" src="common/1x1.gif">
    var buttonDiv = document.getElementById('dialogDoneButtons');
    var pegSpin = document.createElement('img');
    pegSpin.id = 'pegSpin';
    pegSpin.src = 'common/1x1.gif';
    pegSpin.style.backgroundImage = 'url(' + Maze.SKIN.sprite + ')';
    buttonDiv.parentNode.insertBefore(pegSpin, buttonDiv);

    // Lazy-load the JavaScript interpreter.
    BlocklyInterface.importInterpreter();
    // Lazy-load the syntax-highlighting.
    BlocklyInterface.importPrettify();
};

/**
 * When the workspace changes, update the help as needed.
 * @param {Blockly.Events.Abstract=} opt_event Custom data for event.
 */
Maze.levelHelp = function(opt_event) {

};


/**
 * Reload with a different Pegman skin.
 * @param {number} newSkin ID of new skin.
 */
Maze.changePegman = function(newSkin) {
    BlocklyInterface.saveToSessionStorage();
    location = location.protocol + '//' + location.host + location.pathname +
        '?lang=' + BlocklyGames.LANG + '&level=' + BlocklyGames.LEVEL +
        '&skin=' + newSkin;
};

/**
 * Display the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Maze.showPegmanMenu = function(e) {
    var menu = document.getElementById('pegmanMenu');
    if (menu.style.display == 'block') {
        // Menu is already open.  Close it.
        Maze.hidePegmanMenu(e);
        return;
    }
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    var button = document.getElementById('pegmanButton');
    button.classList.add('buttonHover');
    menu.style.top = (button.offsetTop + button.offsetHeight) + 'px';
    menu.style.left = button.offsetLeft + 'px';
    menu.style.display = 'block';
    Maze.pegmanMenuMouse_ =
        Blockly.bindEvent_(document.body, 'mousedown', null, Maze.hidePegmanMenu);
    // Close the skin-changing hint if open.
    var hint = document.getElementById('dialogHelpSkins');
    if (hint && hint.className != 'dialogHiddenContent') {
        BlocklyDialogs.hideDialog(false);
    }
    Maze.showPegmanMenu.activatedOnce = true;
};

/**
 * Hide the Pegman skin-change menu.
 * @param {!Event} e Mouse, touch, or resize event.
 */
Maze.hidePegmanMenu = function(e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    document.getElementById('pegmanMenu').style.display = 'none';
    document.getElementById('pegmanButton').classList.remove('buttonHover');
    if (Maze.pegmanMenuMouse_) {
        Blockly.unbindEvent_(Maze.pegmanMenuMouse_);
        delete Maze.pegmanMenuMouse_;
    }
};

/**
 * Reset the maze to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
Maze.reset = function(first) {
    // Kill all tasks.
    for (var i = 0; i < Maze.pidList.length; i++) {
        clearTimeout(Maze.pidList[i]);
    }
    Maze.pidList = [];

    // Move Pegman into position.
    Maze.pegmanX = Maze.start_.x;
    Maze.pegmanY = Maze.start_.y;

    if (first) {
        // Opening animation.
        Maze.pegmanD = Maze.startDirection + 1;
        Maze.scheduleFinish(false);
        Maze.pidList.push(setTimeout(function() {
            Maze.stepSpeed = 100;
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 - 4]);
            Maze.pegmanD++;
        }, Maze.stepSpeed * 5));
    } else {
        Maze.pegmanD = Maze.startDirection;
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4);
    }

    // Move the finish icon into position.
    var finishIcon = document.getElementById('finish');
    finishIcon.setAttribute('x', Maze.SQUARE_SIZE * (Maze.finish_.x + 0.5) -
        finishIcon.getAttribute('width') / 2);
    finishIcon.setAttribute('y', Maze.SQUARE_SIZE * (Maze.finish_.y + 0.6) -
        finishIcon.getAttribute('height'));

    // Make 'look' icon invisible and promote to top.
    var lookIcon = document.getElementById('look');
    lookIcon.style.display = 'none';
    lookIcon.parentNode.appendChild(lookIcon);
    var paths = lookIcon.getElementsByTagName('path');
    for (var i = 0, path;
        (path = paths[i]); i++) {
        path.setAttribute('stroke', Maze.SKIN.look);
    }
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */


Maze.runButtonClick = function(e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }


    // 

    Maze.levelData[BlocklyGames.LEVEL - 1].countPlay += 1;
    document.querySelector(".outcome__value--play").textContent = Maze.levelData[BlocklyGames.LEVEL - 1].countPlay;


    console.log(Maze.levelData);

    BlocklyDialogs.hideDialog(false);
    // Only allow a single top block on level 1.
    if (BlocklyGames.LEVEL == 1 &&
        BlocklyInterface.workspace.getTopBlocks(false).length > 1 &&
        Maze.result != Maze.ResultType.SUCCESS &&
        !BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
            BlocklyGames.LEVEL)) {
        Maze.levelHelp();
        return;
    }
    var runButton = document.getElementById('runButton');
    var resetButton = document.getElementById('resetButton');
    // Ensure that Reset button is at least as wide as Run button.
    if (!resetButton.style.minWidth) {
        resetButton.style.minWidth = runButton.offsetWidth + 'px';
    }
    runButton.style.display = 'none'; //changed from none
    resetButton.style.display = 'inline';
    Maze.reset(false);
    Maze.play();
};


//προσπάθεια για submit button

Maze.submitButtonClick = function(e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    BlocklyDialogs.hideDialog(false);

    if (timer) {
        clearInterval(timer);
        Maze.levelData[BlocklyGames.LEVEL - 1].time = document.getElementById('capacity').textContent;
        console.log(Maze.levelData[BlocklyGames.LEVEL - 1]);
    }
    // Only allow a single top block on level 1.
    if (BlocklyGames.LEVEL == 1 &&
        BlocklyInterface.workspace.getTopBlocks(false).length > 1 &&
        Maze.result != Maze.ResultType.SUCCESS &&
        !BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
            BlocklyGames.LEVEL)) {
        Maze.levelHelp();
        return;
    }
    var runButton = document.getElementById('runButton');
    var resetButton = document.getElementById('resetButton');
    var submitButton = document.getElementById('submitButton');
    // Ensure that Reset button is at least as wide as Run button.
    if (!resetButton.style.minWidth) {
        resetButton.style.minWidth = runButton.offsetWidth + 'px';
    }
    runButton.style.display = 'none'; //changed from none
    resetButton.style.display = 'none';
    submitButton.style.display = 'none';

    Maze.reset(false);
    Maze.execute();

    // κώδικας για αποθήκευση του score σε κάθε level στο localStorage 

    // Store 
    var lname = "maze_level" + BlocklyGames.LEVEL;
    window.localStorage.setItem(lname, JSON.stringify(Maze.levelData[BlocklyGames.LEVEL - 1]));

    document.querySelector(".outcome__value--score").textContent = Maze.levelData[BlocklyGames.LEVEL - 1].score;
    if (window.localStorage.getItem('total-score')) {
        totalScore = totalScore + Maze.levelData[BlocklyGames.LEVEL - 1].score;
        document.querySelector('.outcome__value--total__score').textContent = totalScore;
        window.localStorage.setItem('total-score', totalScore);
    }

    // console.log(window.localStorage.getItem(BlocklyGames.level));
    // window.localStorage.totalScore = Number(window.localStorage.totalScore) + Number(window.localStorage.getItem(BlocklyGames.level));
    // // Retrieve
    // document.querySelector(".outcome__value--score").textContent = window.localStorage.getItem(BlocklyGames.level);
};



/**
 * Click the reset button.  Reset the maze.
 * @param {!Event} e Mouse or touch event.
 */
Maze.resetButtonClick = function(e) {
    // Prevent double-clicks or double-taps.
    if (BlocklyInterface.eventSpam(e)) {
        return;
    }
    var runButton = document.getElementById('runButton');
    runButton.style.display = 'inline';
    document.getElementById('resetButton').style.display = 'inline'; //changed from none
    BlocklyInterface.workspace.highlightBlock(null);
    Maze.reset(false);
};

/**
 * Inject the Maze API into a JavaScript interpreter.
 * @param {!Interpreter} interpreter The JS-Interpreter.
 * @param {!Interpreter.Object} globalObject Global object.
 */
Maze.initInterpreter = function(interpreter, globalObject) {
    // API
    var wrapper;
    wrapper = function(id) {
        Maze.move(0, id);
    };
    interpreter.setProperty(globalObject, 'moveForward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        Maze.move(2, id);
    };
    interpreter.setProperty(globalObject, 'moveBackward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        Maze.turn(0, id);
    };
    interpreter.setProperty(globalObject, 'turnLeft',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        Maze.turn(1, id);
    };
    interpreter.setProperty(globalObject, 'turnRight',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(0, id);
    };
    interpreter.setProperty(globalObject, 'isPathForward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(1, id);
    };
    interpreter.setProperty(globalObject, 'isPathRight',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(2, id);
    };
    interpreter.setProperty(globalObject, 'isPathBackward',
        interpreter.createNativeFunction(wrapper));
    wrapper = function(id) {
        return Maze.isPath(3, id);
    };
    interpreter.setProperty(globalObject, 'isPathLeft',
        interpreter.createNativeFunction(wrapper));
    wrapper = function() {
        return Maze.notDone();
    };
    interpreter.setProperty(globalObject, 'notDone',
        interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Maze.execute = function() {
    if (!('Interpreter' in window)) {
        // Interpreter lazy loads and hasn't arrived yet.  Try again later.
        setTimeout(Maze.execute, 250);
        return;
    }

    Maze.log = [];
    Blockly.selected && Blockly.selected.unselect();
    var code = BlocklyInterface.getJsCode();
    BlocklyInterface.executedJsCode = code;
    BlocklyInterface.executedCode = BlocklyInterface.getCode();
    Maze.result = Maze.ResultType.UNSET;
    var interpreter = new Interpreter(code, Maze.initInterpreter);

    // Try running the user's code.  There are four possible outcomes:
    // 1. If pegman reaches the finish [SUCCESS], true is thrown.
    // 2. If the program is terminated due to running too long [TIMEOUT],
    //    false is thrown.
    // 3. If another error occurs [ERROR], that error is thrown.
    // 4. If the program ended normally but without solving the maze [FAILURE],
    //    no error or exception is thrown.
    try {
        var ticks = 10000; // 10k ticks runs Pegman for about 8 minutes.
        while (interpreter.step()) {
            if (ticks-- == 0) {
                throw Infinity;
            }
        }
        Maze.result = Maze.notDone() ?
            Maze.ResultType.FAILURE : Maze.ResultType.SUCCESS;
    } catch (e) {
        // A boolean is thrown for normal termination.
        // Abnormal termination is a user error.
        if (e === Infinity) {
            Maze.result = Maze.ResultType.TIMEOUT;
        } else if (e === false) {
            Maze.result = Maze.ResultType.ERROR;
        } else {
            // Syntax error, can't happen.
            Maze.result = Maze.ResultType.ERROR;
            alert(e);
        }
    }

    // Fast animation if execution is successful.  Slow otherwise.
    if (Maze.result == Maze.ResultType.SUCCESS) {
        Maze.stepSpeed = 50;
        Maze.log.push(['finish', null]);
        //αποθήκευσε δεδομένα επιτυχίας
        document.getElementById("msgSuccess").style.display = 'inline';
        Maze.levelData[BlocklyGames.LEVEL - 1].score = 10 * BlocklyGames.LEVEL;
        Maze.levelData[BlocklyGames.LEVEL - 1].result = 'Success';
    } else {
        Maze.stepSpeed = 100;
        //στην περίπτωση που δεν έχουμε success δεν θέλουμε να τρέχει τον κώδικα
        Maze.log.push(['end', null]);
        //αποθήκευσε δεδομένα αποτυχίας
        document.getElementById("msgFail").style.display = 'inline';
        Maze.levelData[BlocklyGames.LEVEL - 1].score = 0;
        Maze.levelData[BlocklyGames.LEVEL - 1].result = 'Failure';
    }


    // Maze.log now contains a transcript of all the user's actions.
    // Reset the maze and animate the transcript.
    Maze.reset(false);
    Maze.pidList.push(setTimeout(Maze.animate, 100));
};

Maze.play = function() {
    if (!('Interpreter' in window)) {
        // Interpreter lazy loads and hasn't arrived yet.  Try again later.
        setTimeout(Maze.play, 250);
        return;
    }

    Maze.log = [];
    Blockly.selected && Blockly.selected.unselect();
    var code = BlocklyInterface.getJsCode();
    BlocklyInterface.executedJsCode = code;
    BlocklyInterface.executedCode = BlocklyInterface.getCode();
    Maze.result = Maze.ResultType.UNSET;
    var interpreter = new Interpreter(code, Maze.initInterpreter);

    // Try running the user's code.  There are four possible outcomes:
    // 1. If pegman reaches the finish [SUCCESS], true is thrown.
    // 2. If the program is terminated due to running too long [TIMEOUT],
    //    false is thrown.
    // 3. If another error occurs [ERROR], that error is thrown.
    // 4. If the program ended normally but without solving the maze [FAILURE],
    //    no error or exception is thrown.
    try {
        var ticks = 10000; // 10k ticks runs Pegman for about 8 minutes.
        while (interpreter.step()) {
            if (ticks-- == 0) {
                throw Infinity;
            }
        }
        // Maze.result = Maze.notDone() ?
        //     Maze.ResultType.FAILURE : Maze.ResultType.SUCCESS;
    } catch (e) {
        // A boolean is thrown for normal termination.
        // Abnormal termination is a user error.
        if (e === Infinity) {
            Maze.result = Maze.ResultType.TIMEOUT;
        } else if (e === false) {
            Maze.result = Maze.ResultType.ERROR;
        } else {
            // Syntax error, can't happen.
            Maze.result = Maze.ResultType.ERROR;
            alert(e);
        }
    }

    // Fast animation if execution is successful.  Slow otherwise.
    if (Maze.result == Maze.ResultType.SUCCESS) {
        return;
        // Maze.log.push(['finish', null]);
    } else {
        Maze.stepSpeed = 150;

    }

    // Maze.log now contains a transcript of all the user's actions.
    // Reset the maze and animate the transcript.
    Maze.reset(false);
    Maze.pidList.push(setTimeout(Maze.animate, 100));
};


/**
 * Iterate through the recorded path and animate pegman's actions.
 */




Maze.animate = function() {
    var action = Maze.log.shift();
    if (!action) {
        BlocklyInterface.highlight(null);
        Maze.levelHelp();
        return;
    }
    BlocklyInterface.highlight(action[1]);

    switch (action[0]) {
        case 'north':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY - 1, Maze.pegmanD * 4]);
            Maze.pegmanY--;
            break;
        case 'east':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX + 1, Maze.pegmanY, Maze.pegmanD * 4]);
            Maze.pegmanX++;
            break;
        case 'south':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY + 1, Maze.pegmanD * 4]);
            Maze.pegmanY++;
            break;
        case 'west':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX - 1, Maze.pegmanY, Maze.pegmanD * 4]);
            Maze.pegmanX--;
            break;
        case 'look_north':
            Maze.scheduleLook(Maze.DirectionType.NORTH);
            break;
        case 'look_east':
            Maze.scheduleLook(Maze.DirectionType.EAST);
            break;
        case 'look_south':
            Maze.scheduleLook(Maze.DirectionType.SOUTH);
            break;
        case 'look_west':
            Maze.scheduleLook(Maze.DirectionType.WEST);
            break;
        case 'fail_forward':
            Maze.scheduleFail(true);
            break;
        case 'fail_backward':
            Maze.scheduleFail(false);
            break;
        case 'left':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 - 4]);
            Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD - 1);
            break;
        case 'right':
            Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4], [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 + 4]);
            Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD + 1);
            break;
            //βάλαμε την παρακάτω περίπτωση αν έχουμε fail και πατάμε submit
        case 'end':
            BlocklyInterface.saveToLocalStorage();
            setTimeout(BlocklyDialogs.endOfLevel, 1000);
            break;
        case 'finish':
            Maze.scheduleFinish(true);
            BlocklyInterface.saveToLocalStorage();
            setTimeout(BlocklyDialogs.congratulations, 1000);
    }

    Maze.pidList.push(setTimeout(Maze.animate, Maze.stepSpeed * 5));
};

/**
 * Point the congratulations Pegman to face the mouse.
 * @param {Event} e Mouse move event.
 * @private
 */
Maze.updatePegSpin_ = function(e) {
    if (document.getElementById('dialogDone').className ==
        'dialogHiddenContent') {
        return;
    }
    var pegSpin = document.getElementById('pegSpin');
    var bBox = BlocklyDialogs.getBBox_(pegSpin);
    var x = bBox.x + bBox.width / 2 - window.pageXOffset;
    var y = bBox.y + bBox.height / 2 - window.pageYOffset;
    var dx = e.clientX - x;
    var dy = e.clientY - y;
    var angle = Blockly.utils.math.toDegrees(Math.atan(dy / dx));
    // 0: North, 90: East, 180: South, 270: West.
    if (dx > 0) {
        angle += 90;
    } else {
        angle += 270;
    }
    // Divide into 16 quads.
    var quad = Math.round(angle / 360 * 16);
    if (quad == 16) {
        quad = 15;
    }
    // Display correct Pegman sprite.
    pegSpin.style.backgroundPosition = (-quad * Maze.PEGMAN_WIDTH) + 'px 0px';
};

/**
 * Schedule the animations for a move or turn.
 * @param {!Array.<number>} startPos X, Y and direction starting points.
 * @param {!Array.<number>} endPos X, Y and direction ending points.
 */
Maze.schedule = function(startPos, endPos) {
    var deltas = [(endPos[0] - startPos[0]) / 4,
        (endPos[1] - startPos[1]) / 4,
        (endPos[2] - startPos[2]) / 4
    ];
    Maze.displayPegman(startPos[0] + deltas[0],
        startPos[1] + deltas[1],
        Maze.constrainDirection16(startPos[2] + deltas[2]));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(startPos[0] + deltas[0] * 2,
            startPos[1] + deltas[1] * 2,
            Maze.constrainDirection16(startPos[2] + deltas[2] * 2));
    }, Maze.stepSpeed));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(startPos[0] + deltas[0] * 3,
            startPos[1] + deltas[1] * 3,
            Maze.constrainDirection16(startPos[2] + deltas[2] * 3));
    }, Maze.stepSpeed * 2));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(endPos[0], endPos[1],
            Maze.constrainDirection16(endPos[2]));
    }, Maze.stepSpeed * 3));
};

/**
 * Schedule the animations and sounds for a failed move.
 * @param {boolean} forward True if forward, false if backward.
 */
Maze.scheduleFail = function(forward) {
    var deltaX = 0;
    var deltaY = 0;
    switch (Maze.pegmanD) {
        case Maze.DirectionType.NORTH:
            deltaY = -1;
            break;
        case Maze.DirectionType.EAST:
            deltaX = 1;
            break;
        case Maze.DirectionType.SOUTH:
            deltaY = 1;
            break;
        case Maze.DirectionType.WEST:
            deltaX = -1;
            break;
    }
    if (!forward) {
        deltaX = -deltaX;
        deltaY = -deltaY;
    }
    if (Maze.SKIN.crashType == Maze.CRASH_STOP) {
        // Bounce bounce.
        deltaX /= 4;
        deltaY /= 4;
        var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4);
        Maze.displayPegman(Maze.pegmanX + deltaX,
            Maze.pegmanY + deltaY,
            direction16);
        BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
        Maze.pidList.push(setTimeout(function() {
            Maze.displayPegman(Maze.pegmanX,
                Maze.pegmanY,
                direction16);
        }, Maze.stepSpeed));
        Maze.pidList.push(setTimeout(function() {
            Maze.displayPegman(Maze.pegmanX + deltaX,
                Maze.pegmanY + deltaY,
                direction16);
            BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
        }, Maze.stepSpeed * 2));
        Maze.pidList.push(setTimeout(function() {
            Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, direction16);
        }, Maze.stepSpeed * 3));
    } else {
        // Add a small random delta away from the grid.
        var deltaZ = (Math.random() - 0.5) * 10;
        var deltaD = (Math.random() - 0.5) / 2;
        deltaX += (Math.random() - 0.5) / 4;
        deltaY += (Math.random() - 0.5) / 4;
        deltaX /= 8;
        deltaY /= 8;
        var acceleration = 0;
        if (Maze.SKIN.crashType == Maze.CRASH_FALL) {
            acceleration = 0.01;
        }
        Maze.pidList.push(setTimeout(function() {
            BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
        }, Maze.stepSpeed * 2));
        var setPosition = function(n) {
            return function() {
                var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4 +
                    deltaD * n);
                Maze.displayPegman(Maze.pegmanX + deltaX * n,
                    Maze.pegmanY + deltaY * n,
                    direction16,
                    deltaZ * n);
                deltaY += acceleration;
            };
        };
        // 100 frames should get Pegman offscreen.
        for (var i = 1; i < 100; i++) {
            Maze.pidList.push(setTimeout(setPosition(i),
                Maze.stepSpeed * i / 2));
        }
    }
};

/**
 * Schedule the animations and sound for a victory dance.
 * @param {boolean} sound Play the victory sound.
 */
Maze.scheduleFinish = function(sound) {
    var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4);
    Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 16);
    if (sound) {
        BlocklyInterface.workspace.getAudioManager().play('win', 0.5);
    }
    Maze.stepSpeed = 150; // Slow down victory animation a bit.
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 18);
    }, Maze.stepSpeed));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, 16);
    }, Maze.stepSpeed * 2));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, direction16);
    }, Maze.stepSpeed * 3));
};

/**
 * Display Pegman at the specified location, facing the specified direction.
 * @param {number} x Horizontal grid (or fraction thereof).
 * @param {number} y Vertical grid (or fraction thereof).
 * @param {number} d Direction (0 - 15) or dance (16 - 17).
 * @param {number=} opt_angle Optional angle (in degrees) to rotate Pegman.
 */
Maze.displayPegman = function(x, y, d, opt_angle) {
    var pegmanIcon = document.getElementById('pegman');
    pegmanIcon.setAttribute('x',
        x * Maze.SQUARE_SIZE - d * Maze.PEGMAN_WIDTH + 1);
    pegmanIcon.setAttribute('y',
        Maze.SQUARE_SIZE * (y + 0.5) - Maze.PEGMAN_HEIGHT / 2 - 8);
    if (opt_angle) {
        pegmanIcon.setAttribute('transform', 'rotate(' + opt_angle + ', ' +
            (x * Maze.SQUARE_SIZE + Maze.SQUARE_SIZE / 2) + ', ' +
            (y * Maze.SQUARE_SIZE + Maze.SQUARE_SIZE / 2) + ')');
    } else {
        pegmanIcon.setAttribute('transform', 'rotate(0, 0, 0)');
    }

    var clipRect = document.getElementById('clipRect');
    clipRect.setAttribute('x', x * Maze.SQUARE_SIZE + 1);
    clipRect.setAttribute('y', pegmanIcon.getAttribute('y'));
};

/**
 * Display the look icon at Pegman's current location,
 * in the specified direction.
 * @param {!Maze.DirectionType} d Direction (0 - 3).
 */
Maze.scheduleLook = function(d) {
    var x = Maze.pegmanX;
    var y = Maze.pegmanY;
    switch (d) {
        case Maze.DirectionType.NORTH:
            x += 0.5;
            break;
        case Maze.DirectionType.EAST:
            x += 1;
            y += 0.5;
            break;
        case Maze.DirectionType.SOUTH:
            x += 0.5;
            y += 1;
            break;
        case Maze.DirectionType.WEST:
            y += 0.5;
            break;
    }
    x *= Maze.SQUARE_SIZE;
    y *= Maze.SQUARE_SIZE;
    var deg = d * 90 - 45;

    var lookIcon = document.getElementById('look');
    lookIcon.setAttribute('transform',
        'translate(' + x + ', ' + y + ') ' +
        'rotate(' + deg + ' 0 0) scale(.4)');
    var paths = lookIcon.getElementsByTagName('path');
    lookIcon.style.display = 'inline';
    for (var i = 0, path;
        (path = paths[i]); i++) {
        Maze.scheduleLookStep(path, Maze.stepSpeed * i);
    }
};

/**
 * Schedule one of the 'look' icon's waves to appear, then disappear.
 * @param {!Element} path Element to make appear.
 * @param {number} delay Milliseconds to wait before making wave appear.
 */
Maze.scheduleLookStep = function(path, delay) {
    Maze.pidList.push(setTimeout(function() {
        path.style.display = 'inline';
        setTimeout(function() {
            path.style.display = 'none';
        }, Maze.stepSpeed * 2);
    }, delay));
};

/**
 * Keep the direction within 0-3, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze.constrainDirection4 = function(d) {
    d = Math.round(d) % 4;
    if (d < 0) {
        d += 4;
    }
    return d;
};

/**
 * Keep the direction within 0-15, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze.constrainDirection16 = function(d) {
    d = Math.round(d) % 16;
    if (d < 0) {
        d += 16;
    }
    return d;
};

// Core functions.

/**
 * Attempt to move pegman forward or backward.
 * @param {number} direction Direction to move (0 = forward, 2 = backward).
 * @param {string} id ID of block that triggered this action.
 * @throws {true} If the end of the maze is reached.
 * @throws {false} If Pegman collides with a wall.
 */
Maze.move = function(direction, id) {
    if (!Maze.isPath(direction, null)) {
        Maze.log.push(['fail_' + (direction ? 'backward' : 'forward'), id]);
        throw false;
    }
    // If moving backward, flip the effective direction.
    var effectiveDirection = Maze.pegmanD + direction;
    var command;
    switch (Maze.constrainDirection4(effectiveDirection)) {
        case Maze.DirectionType.NORTH:
            Maze.pegmanY--;
            command = 'north';
            break;
        case Maze.DirectionType.EAST:
            Maze.pegmanX++;
            command = 'east';
            break;
        case Maze.DirectionType.SOUTH:
            Maze.pegmanY++;
            command = 'south';
            break;
        case Maze.DirectionType.WEST:
            Maze.pegmanX--;
            command = 'west';
            break;
    }
    Maze.log.push([command, id]);
};

/**
 * Turn pegman left or right.
 * @param {number} direction Direction to turn (0 = left, 1 = right).
 * @param {string} id ID of block that triggered this action.
 */
Maze.turn = function(direction, id) {
    if (direction) {
        // Right turn (clockwise).
        Maze.pegmanD++;
        Maze.log.push(['right', id]);
    } else {
        // Left turn (counterclockwise).
        Maze.pegmanD--;
        Maze.log.push(['left', id]);
    }
    Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD);
};

/**
 * Is there a path next to pegman?
 * @param {number} direction Direction to look
 *     (0 = forward, 1 = right, 2 = backward, 3 = left).
 * @param {?string} id ID of block that triggered this action.
 *     Null if called as a helper function in Maze.move().
 * @return {boolean} True if there is a path.
 */
Maze.isPath = function(direction, id) {
    var effectiveDirection = Maze.pegmanD + direction;
    var square;
    var command;
    switch (Maze.constrainDirection4(effectiveDirection)) {
        case Maze.DirectionType.NORTH:
            square = Maze.map[Maze.pegmanY - 1] &&
                Maze.map[Maze.pegmanY - 1][Maze.pegmanX];
            command = 'look_north';
            break;
        case Maze.DirectionType.EAST:
            square = Maze.map[Maze.pegmanY][Maze.pegmanX + 1];
            command = 'look_east';
            break;
        case Maze.DirectionType.SOUTH:
            square = Maze.map[Maze.pegmanY + 1] &&
                Maze.map[Maze.pegmanY + 1][Maze.pegmanX];
            command = 'look_south';
            break;
        case Maze.DirectionType.WEST:
            square = Maze.map[Maze.pegmanY][Maze.pegmanX - 1];
            command = 'look_west';
            break;
    }
    if (id) {
        Maze.log.push([command, id]);
    }
    return square !== Maze.SquareType.WALL && square !== undefined;
};

/**
 * Is the player at the finish marker?
 * @return {boolean} True if not done, false if done.
 */
Maze.notDone = function() {
    return Maze.pegmanX != Maze.finish_.x || Maze.pegmanY != Maze.finish_.y;
};

window.addEventListener('load', Maze.init);