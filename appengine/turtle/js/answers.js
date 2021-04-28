/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Sample answers for Turtle levels. Used for prompts and marking.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Turtle.Answers');


/**
 * Sample solutions for each level.
 * To create an answer, just solve the level in Blockly, then paste the
 * resulting JavaScript here, moving any functions to the beginning of
 * this function.
 */
Turtle.answer = function() {
    // Helper functions.
    function drawStar(length) {
        for (var count = 0; count < 5; count++) {
            Turtle.move(length);
            Turtle.turn(144);
        }
    }

    switch (BlocklyGames.LEVEL) {
        case 1:
            // Square.
            for (var count = 0; count < 4; count++) {
                Turtle.move(100);
                Turtle.turn(90);
            }
            break;
        case 2:
            // Pentagon.
            for (var count = 0; count < 5; count++) {
                Turtle.move(100);
                Turtle.turn(72);
            }
            break;
        case 3:
            // Star.
            Turtle.penColour('#ffff00');
            drawStar(100);
            break;
        case 4:
            // Pen up/down.
            Turtle.penColour('#ffff00');
            drawStar(50);
            Turtle.penDown(false);
            Turtle.move(150);
            Turtle.penDown(true);
            Turtle.move(20);
            break;
        case 5:
            // Square.
            for (var count = 0; count < 4; count++) {
                Turtle.move(100);
                Turtle.turn(90);
            }
            break;
        case 6:
            // Square.
            for (var count = 0; count < 4; count++) {
                Turtle.move(100);
                Turtle.turn(90);
            }
            break;
        case 7:
            // Square. 
            Turtle.penColour('#ff0000');
            for (var count = 0; count < 4; count++) {
                Turtle.move(100);
                Turtle.turn(90);
            }
            break;
        case 8:
            // ορθογώνιο.
            for (var count = 0; count < 2; count++) {
                Turtle.move(50);
                Turtle.turn(90);
                Turtle.move(100);
                Turtle.turn(90);
            }
            break;
        case 9:
            // ισόπλευρο τρίγωνο.
            for (var count = 0; count < 3; count++) {
                Turtle.move(50);
                Turtle.turn(120);
            }
            break;
        case 10:
            // Pen up/down.
            Turtle.penColour('#ffff00');
            for (var count = 0; count < 4; count++) {
                for (var j = 0; j < 3; j++) {
                    Turtle.move(50);
                    Turtle.turn(120);
                }
                Turtle.turn(90);
            }
            // drawStar(50);
            // Turtle.penDown(false);
            // Turtle.move(150);
            // Turtle.penDown(true);
            // Turtle.move(20);
            break;
    }
};

/**
 * Validate whether the user's answer is correct.
 * @param {number} pixelErrors Number of pixels that are wrong.
 * @return {boolean} True if the level is solved, false otherwise.
 */
Turtle.isCorrect = function(pixelErrors) {
    /* if (BlocklyGames.LEVEL == BlocklyGames.MAX_LEVEL) {
        // Any non-null answer is correct.
        return BlocklyInterface.workspace.getAllBlocks().length > 1;
    } */
    console.log('Pixel errors: ' + pixelErrors);
    // There's an alternate solution for level 9 that has the moon rotated by
    // 12 degrees.  Allow that one to pass.
    // https://groups.google.com/forum/#!topic/blockly-games/xMwt-JHnZGY
    if (pixelErrors > 100) {
        // Too many errors.
        return false;
    }
    var blockCount = BlocklyInterface.workspace.getAllBlocks().length;
    if ((BlocklyGames.LEVEL <= 8 && blockCount > 5) ||
        (BlocklyGames.LEVEL == 9 && blockCount > 4)) {
        // Use a loop, dummy.
        var content = document.getElementById('helpUseLoop');
        var style = {
            'width': '30%',
            'left': '35%',
            'top': '12em'
        };
        BlocklyDialogs.showDialog(content, null, false, true, style,
            BlocklyDialogs.stopDialogKeyDown);
        BlocklyDialogs.startDialogKeyDown();
        return false;
    }
    return true;
};