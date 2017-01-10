//This block is responsible for randomizing what puzzle you start on 
Array.prototype.randomize = function () {
    var i = this.length;
    if (i === 0) return false;
    while (--i) {
        var j = Math.floor(Math.random() * (i + 1));
        var tempi = this[i];
        var tempj = this[j];
        this[i] = tempj;
        this[j] = tempi;
    }
};
/////////////////////////////////////////////////////////////////////////////////////
Array.prototype.toObject = function () {
    var o = {};
    for (var i = 0; i < this.length; i++) {
        o[this[i]] = '';
    }
    return o;
};
/////////////////////////////////////////////////////////////////////////////////////
function bindEvent(el, eventName, eventHandler) {
    if (el.addEventListener) {
        el.addEventListener(eventName, eventHandler, false);
    } else if (el.attachEvent) {
        el.attachEvent('on' + eventName, eventHandler);
    }
}

//////////////////////////////////////////////////////////////////////////////////////
//this block of code handles making a new wheel and assigning point values to each section of the wheel 
//there are also a few transforms that makes it so the wheel will spin no matter what browser you are in
var Wheel = (function () {
    var wheel = document.getElementById('wheel'),
        wheelValues = [5000, 600, 500, 300, 500, 800, 550, 400, 300, 900, 500, 300, 900, 0, 600, 400, 300, -2, 800, 350, 450, 700, 300, 600],
        spinTimeout = false,
        spinModifier = function () {
            return Math.random() * 10 + 20;
        },
        modifier = spinModifier(),
        slowdownSpeed = 0.5,
        prefix = (function () {
            if (document.body.style.MozTransform !== undefined) {
                return "MozTransform";
            } else if (document.body.style.WebkitTransform !== undefined) {
                return "WebkitTransform";
            } else if (document.body.style.OTransform !== undefined) {
                return "OTransform";
            } else {
                return "";
            }
        }()),
        degreeToRadian = function (deg) {
            return deg / (Math.PI * 180);
        };

    function Wheel() {}//calls the wheel function
// this function is what actually makes the wheel spin. it spins the image and then from the code abougt finds out what section
// it is in and then adds that score to your player if you get the letter correct
    Wheel.prototype.rotate = function (degrees) {
        var val = "rotate(-" + degrees + "deg)";
        if (wheel.style[prefix] !== undefined) wheel.style[prefix] = val;
        var rad = degreeToRadian(degrees % 360),
            filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11=" + rad + ", M12=-" + rad + ", M21=" + rad + ", M22=" + rad + ")";
        if (wheel.style.filter !== undefined) wheel.style.filter = filter;
        wheel.setAttribute("data-rotation", degrees);
    };
    
    Wheel.prototype.addEventListener = function(eventName, eventHandler) {
        wheel.addEventListener(eventName, eventHandler, false);
    }
//this block controls how lond the wheel will spin and whate happens if you land on a special tile like skip
//turn or bankrupt
    Wheel.prototype.spin = function (callback, amount) {
        var _this = this;
        clearTimeout(spinTimeout);
        modifier -= slowdownSpeed;
        if (amount === undefined) {
            amount = parseInt(wheel.getAttribute('data-rotation'), 10);
        }
        this.rotate(amount);
        if (modifier > 0) {
            spinTimeout = setTimeout(function () {
                _this.spin(callback, amount + modifier);
            }, 1000 / 5);
        } else {
            var dataRotation = parseInt(wheel.getAttribute('data-rotation'), 10);
            modifier = spinModifier();
            var divider = 360 / wheelValues.length;
            var offset = divider / 2; //half division
            var wheelValue = wheelValues[Math.floor(Math.ceil((dataRotation + offset) % 360) / divider)];
            switch (wheelValue) {
                case 0:
                    return callback(0);
                case -1:
                    return callback("Free Spin");
                case -2:
                    return callback("Lose a turn");
                default:
                    return callback(wheelValue);
            }
        }
    };

    return Wheel;
})();

////////////////////////////////////////////////////////////////////////////////////
//this is the block wheere the actual game begins. the first thing that is done is variables are made 
//that gets all the buttons on the page and turn them into easier to use variables
var WheelGame = (function () {
    var wheel = new Wheel(),
        vowels = ['A', 'E', 'I', 'O', 'U'],
        spinWheel = document.getElementById('spin'),
        buyVowel = document.getElementById('vowel'),
        displayArea = document.getElementById('display'),
        newButton = document.getElementById('newpuzzle'),
        money = document.getElementById('money'),
        solve = document.getElementById('solve');
    //this block sets up the game to be played by first setting the values it needs when begining
    function WheelGame(puzzles) {
        var _this = this;
        this.puzzles = puzzles;
        this.puzzles.randomize();
        this.currentMoney = 0;
        this.puzzleSolved = false;
//this is for the buy a vowel alert when used it check if your money is greater than 200 and if it is allows you
//to buy a vowel from the pop up box
        bindEvent(buyVowel, "click", function () {
            if (_this.currentMoney > 200) {
                if (_this.createGuessPrompt("PLEASE ENTER A VOWEL", true) !== false) {
                    _this.currentMoney -= 200;
                    _this.updateMoney();
                }
            } else {
                alert("You need more than $200 to buy a vowel");
            }
        });
        //this makes is so you can start a new round whenever you want by usin the new round function
        bindEvent(newButton, "click", function () {
            _this.newRound();
        });
        // this block spins the wheel and finds the value of whatever is landed on
        var spinTheWheel = function () {
            wheel.spin(function (valueSpun) {
                if (isNaN(valueSpun)) {
                    alert(valueSpun);
                } else {
                    //is a valid number
                    if (valueSpun === 0) {
                        alert('Bankrupt!');
                        _this.currentMoney = 0;
                    } else {
                        //spun greater than 0
                        var amountFound = _this.createGuessPrompt(valueSpun);
                        _this.currentMoney += (valueSpun * amountFound);
                    }
                    _this.updateMoney();
                }
            });
        };
        bindEvent(spinWheel, "click", spinTheWheel);
        bindEvent(wheel, "click", spinTheWheel);

        function arrays_equal(a, b) {
            return !(a < b || b < a);
        }
// this block brings up a pop up when you want to try and solve the puzzle if you solve it, it will congratulate you
// if now it will tell you that the puzzle is not solved and you can keep playing
        bindEvent(solve, "click", function () {
            if (!_this.puzzleSolved) {
                var solve = prompt("Solve the puzzle?", "");
                if (solve) {
                    guess = solve.toUpperCase().split("");
                    if (arrays_equal(guess, _this.currentPuzzleArray)) {
                        for (var i = 0; i < guess.length; ++i) {
                            _this.guessLetter(guess[i], false, true);
                        }
                    }
                    if (!_this.puzzleSolved) {
                        alert('PUZZLE NOT SOLVED');
                    }
                }
            }
        });
        this.startRound(0); //start the 1st round
    }

// update money is pretty self explanitory but it adds money to your total whenever you earn it
    WheelGame.prototype.updateMoney = function () {
        money.innerHTML = this.currentMoney;
    };

// the guess letter block does a lot of checking it takes the value from the input box and check to see if it matches 
// and of the letter is the puzzle if it is then it will add the money to your total score if not it will have you 
// keep spinning and guessing the letters until you solve the puzzle
    WheelGame.prototype.guessLetter = function (guess, isVowel, solvingPuzzle) {
        var timesFound = 0;
        solvingPuzzle = solvingPuzzle === undefined ? false : true;
        //find it:
        if (guess.length && !this.puzzleSolved) {
            if (!solvingPuzzle && !isVowel && (guess in vowels.toObject())) {
                alert("Cannot guess a vowel right now!");
                return false;
            }
            if (!solvingPuzzle && isVowel && !(guess in vowels.toObject())) {
                alert("Cannot guess a consanant right now!");
                return false;
            }
            for (var i = 0; i < this.currentPuzzleArray.length; ++i) {
                if (guess == this.currentPuzzleArray[i]) {
                    var span = document.getElementById("letter" + i);
                    if (span.innerHTML != guess) {
                        //found it
                        ++timesFound;
                    }
                    span.innerHTML = guess;
                    if (guess in this.lettersInPuzzle.toObject() && !(guess in this.guessedArray.toObject())) {
                        this.guessedArray.push(guess);
                    }
                }
            }

            if (this.guessedArray.length == this.lettersInPuzzle.length) {
                alert("PUZZLE SOLVED!");
                this.puzzleSolved = true;
            }

            return timesFound;
        }
        return false;

    };
// this block lets you know when only a vowel is left and will then prompt you to choose one
    var guessTimes = 0;
    WheelGame.prototype.createGuessPrompt = function (valueSpun, isVowel) {
        isVowel = isVowel === undefined ? false : true;
        if (!this.puzzleSolved) {
            var letter;
            if (isVowel) {
                letter = prompt("PLEASE ENTER A VOWEL", "");
            } else {
                letter = prompt("YOU SPUN A " + valueSpun + " PLEASE ENTER A CONSONANT", "");
            }
            if (letter) {
                var guess = letter.toUpperCase().charAt(0);
                var timesFound = this.guessLetter(guess, isVowel);
                if (timesFound === false) {
                    ++guessTimes;
                    if (guessTimes < 5) {
                        return this.createGuessPrompt(valueSpun, isVowel);
                    }
                }
                guessTimes = 0;
                return timesFound;
            } else {
                ++guessTimes;
                if (guessTimes < 5) {
                    return this.createGuessPrompt(valueSpun, isVowel);
                }
                else {
                    // reset guessTimes
                    guessTimes = 0;
                }
            }
        }
        return false;
    };
// this function sets up a new round by going through the first couple of functions to set up the new round
// if there are no more puzzles then it says so
    WheelGame.prototype.newRound = function () {
        var round = ++this.round;
        if (round < this.puzzles.length) {
            while (displayArea.hasChildNodes()) { //remove old puzzle
                displayArea.removeChild(displayArea.firstChild);
            }
            this.startRound(round);
        } else {
            alert("No more puzzles!");
        }
    };


////////////////////////////////////////////////////////////////////////////////////////////////////
// this function is run at the begining of each round it is responsible for going through the list of possble
// puzzles and randomly choosing one. When it has chosen a puzzle it changes the html on the page to have empty boxes 
//equal to the letter in the puzzle. It also changes the html is a div to show the hint associated with the puzzle/
    WheelGame.prototype.startRound = function (round) {
        this.round = round;
        this.lettersInPuzzle = [];
        this.guessedArray = [];
        this.puzzleSolved = false;
        this.currentPuzzle = this.puzzles[this.round].toUpperCase();
        this.currentPuzzleArray = this.currentPuzzle.split("");
        var currentPuzzleArray = this.currentPuzzleArray;
        var lettersInPuzzle = this.lettersInPuzzle;
        var word = document.createElement('div');
        var hints = {
            "star wars": "Luke I am your father",
            "lord of the rings": "One ring to rule them all",
            "batman v superman": "THEY'RE GOING TO KILL MARTHA",
            "doctor strange": "I've come to bargain",
            "civil war": "Super hero smack down"
        };
        displayArea.appendChild(word);
        word.className = "word";
        for (var i = 0; i < currentPuzzleArray.length; ++i) {
            var span = document.createElement('div');
            span.className = "wordLetter ";


            if (currentPuzzleArray[i] != " ") {
                span.className += "letter";
                if (!(currentPuzzleArray[i] in lettersInPuzzle.toObject())) {
                    lettersInPuzzle.push(currentPuzzleArray[i]);
                }
                word.appendChild(span);
            } else {
                span.className += "space";
                word = document.createElement('div');
                displayArea.appendChild(word);
                word.className = "word";
                word.appendChild(span);
                word = document.createElement('div');
                displayArea.appendChild(word);
                word.className = "word";
                hint = document.getElementById('hintword');
                hint.innerHTML = hints[this.currentPuzzle.toLowerCase()];
            }

            span.id = "letter" + i;
        }
// after the puzzle is done it clears the feild and goes back to the Wheelgame function to start again
        var clear = document.createElement('div');
        displayArea.appendChild(clear);
        clear.className = "clear";
    };

    return WheelGame;
})();
////////////////////////////////////////////////////////////////////////////////////
// this is the new instance of the game that has all the possibe puzzles in it!
var Game = new WheelGame([
    "star wars", "lord of the rings", "batman v superman", "doctor strange", "civil war"
]);