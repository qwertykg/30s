var express = require("express");
var socket = require("socket.io");

var app = express();

var server = app.listen(3000, "0.0.0.0");
app.use(express.static("public"));

var io = socket(server);

var team1 = [];
var team2 = [];

var words;

var turns = [];
var turnIndex = 0;
var turnDice = 0;

var team1Score = 0;
var team2Score = 0;

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
  }

var listOfWords = require("./words.json").words;
shuffle(listOfWords);

io.sockets.on("connection", function(socket)
{
    socket.on("playerEnteredTeam1", function(data)
    {
        team1.push(data.name);
        io.sockets.emit("team1", team1);
        io.sockets.emit("team2", team2);
    });

    socket.on("playerEnteredTeam2", function(data)
    {
        team2.push(data.name);
        io.sockets.emit("team1", team1);
        io.sockets.emit("team2", team2);
    });

    socket.on("team1update", function(data)
    {
        team1 = data.team1;
    });

    socket.on("team2update", function(data)
    {
        team2 = data.team2;
    });

    socket.on("playerSwitchedTeams", function(data)
    {
        io.sockets.emit("switchData", data);
    });

    socket.on("restartGame", function(data)
    {
        team1 = [];
        team2 = [];
        
        words = [];        
        turns = [];
        turnIndex = 0;
        turnDice = 0;
        
        team1Score = 0;
        team2Score = 0;
        
        var listOfWords = require("./words.json").words;
        shuffle(listOfWords);

        io.sockets.emit("refreshBrowser", data);
    });

    socket.on("startGame", function(data)
    {
        team1 = data.team1;
        team2 = data.team2;

        console.log(data.team1);
        console.log(data.team2); //spam team change

        turns = [];
        var cc = 0;
        for(var i =0; i < 500; i++)
        {
            if(team1[i])
            {
                turns[cc] = team1[i];
                cc++;
            }

            if(team2[i])
            {
                turns[cc] = team2[i];
                cc++;
            }
        }
        console.log(turns[0]);
        console.log(turns[1]);
        console.log(turns[2]);
        console.log(turns[3]);
        console.log(turns[4]);
        console.log(turns[5]);
        console.log(turns[6]);
        console.log(turns[7]);

        var userTurn = turns[turnIndex];

        io.sockets.emit("gameHasStarted", userTurn);
    });

    socket.on("rollDice", function(data)
    {
        const dice = [0, 0, 1, 1, 2, 2];
        turnDice = dice[Math.floor(Math.random() * dice.length)];
        
        io.sockets.emit("dieResult", {die: turnDice, player: turns[turnIndex]});

    });

    socket.on("revealWords", function(data)
    {
        words = [];

        words.push(listOfWords.shift());
        words.push(listOfWords.shift());
        words.push(listOfWords.shift());
        words.push(listOfWords.shift());
        words.push(listOfWords.shift());

        socket.emit("wordsToPlayer", words);

        var count = 30;

        io.sockets.emit("timer", count);

        var interval = setInterval(function()
        {
             count--;

             io.sockets.emit("timer", count);

             if(count == 0)
             {
                io.sockets.emit("words", {words: words, player: turns[turnIndex]});

                clearInterval(interval);
             }
        }, 1000);
    });

    socket.on("endTurn", function(data)
    {
        socket.emit("getStateOfWordsFromClient", words);
    });

    socket.on("score", function(data)
    {
        var score = data - turnDice;

        if (score > 0)
        {
            var player = turns[turnIndex];

            var result;
            var team;

            if (team1.includes(player))
            {
                team1Score += score;
                result = "Team1 Score: " + team1Score + " / 15";
                team = "team1Score";
            }
            else
            {
                team2Score += score;
                result = "Team2 Score: " + team2Score + " / 15";
                team = "team2Score";
            }
            io.sockets.emit("newScore", {result: result, team: team});

            if (team1Score >= 15)
            {
                io.sockets.emit("team1Wins", {});
            }

            if (team2Score >= 15)
            {
                io.sockets.emit("team2Wins", {});
            }
        }

        turnIndex++;
        var userTurn = turns[turnIndex];

        if(!userTurn)
        {
            turnIndex = 0;
            userTurn = turns[turnIndex];
        }
        io.sockets.emit("nextTurn", userTurn);
    });
});