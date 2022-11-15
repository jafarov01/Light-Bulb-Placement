//Light bulb placement
const body = document.querySelector("body");
const divStartPage = document.querySelector("#divStartPage");
const buttonStart = document.querySelector("#buttonStart");
const divPlayPage = document.querySelector("#divPlayPage");
const divCustomGridPage = document.querySelector("#divCustomGridPage");
let divCustomGrid;
const divEditCustomGrid = document.querySelector("#divEditCustomGrid");
const inputGridSize = document.querySelector("#inputGridSize")
const buttonSetGrid = document.querySelector("#buttonSetGrid");
const elements = document.getElementsByClassName("elements");
const gridContainer = document.querySelector("#grid");
const h2PlayerName = document.querySelector("#h2PlayerName");
const h3Time = document.querySelector("#h3Time");
const h3NumLumps = document.querySelector("#h3NumLumps");
const h1WinMessage = document.querySelector("#h1WinMessage");
const divScoreBoard = document.querySelector("#divScoreBoard");
const puzzle_error = new Audio('./sounds/sound.mp3');
const score_btn = document.querySelector(".score_board");
const custom_btn = document.querySelector(".custom_maps");
const IMG = document.querySelector("#imgStartPage");
const divChangeDifficulty = document.querySelector("#divChangeDifficulty");
const buttonChangeDiffStart = document.querySelector("#buttonChangeDiffStart");
const divCustomMaps = document.querySelector("#divCustomMaps");

const savedScoreBoard = JSON.parse(localStorage.getItem("scoreBoard")) ?? [];
const savedCustomMaps = JSON.parse(localStorage.getItem("savedMaps")) ?? [];
let scoreBoard = [...savedScoreBoard];
let customGrids = [...savedCustomMaps];

const GAME_INFO = document.querySelector("#gameInfo");

const easyGrid =
    [
        ["", "", "", "1", "", "", ""],
        ["", "0", "", "", "", "2", ""],
        ["", "", "", "", "", "", ""],
        ["+", "", "", "+", "", "", "+"],
        ["", "", "", "", "", "", ""],
        ["", "+", "", "", "", "2", ""],
        ["", "", "", "3", "", "", ""],
    ]

const mediumGrid =
    [
        ["", "", "0", "", "+", "", ""],
        ["", "", "", "", "", "", ""],
        ["+", "", "+", "", "3", "", "+"],
        ["", "", "", "1", "", "", ""],
        ["2", "", "+", "", "+", "", "+"],
        ["", "", "", "", "", "", ""],
        ["", "", "+", "", "2", "", ""]
    ]

const hardGrid =
    [
        ["", "+", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "3", "", "2", "", "+"],
        ["", "0", "+", "", "", "", "", "+", "", ""],
        ["", "", "", "", "+", "", "", "", "", ""],
        ["", "1", "", "", "+", "1", "+", "", "", ""],
        ["", "", "", "+", "+", "+", "", "", "3", ""],
        ["", "", "", "", "", "+", "", "", "", ""],
        ["", "", "1", "", "", "", "", "0", "+", ""],
        ["3", "", "+", "", "0", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "0", ""]
    ]




let currentGrid;
let currentContainer;

let playerName;
let startTime, endTime;
let timeElapsed;
let numLamps = 0;
let isPaused = false;
let isScore = false;
let isCustom = false;
let level;

function saveCustomMap() {
    let customData = {
        "playerName": playerName,
        "map": currentGrid
    }

    customGrids.push(customData);


    localStorage.setItem("savedMaps", JSON.stringify(customGrids));
}
function saveGameData() {
    let gameData = {
        "playerName": playerName,
        "level": level,
        "timeElapsed": timeElapsed
    }

    let update = false;

    for (let i = 0; i < scoreBoard.length; i++) {
        let score = scoreBoard[i];

        if (score.playerName === gameData.playerName && score.level === gameData.level) {
            score.timeElapsed = gameData.timeElapsed;
            update = true;
        }
    }

    if (!update) scoreBoard.push(gameData);

    console.log("storage:", scoreBoard);

    localStorage.setItem("scoreBoard", JSON.stringify(scoreBoard));
}

function loadPlayPage() {
    divPlayPage.style.display = "flex";

    renderBoard();
    play();
    startTime = new Date();
    h2PlayerName.innerHTML = playerName;

    h3Time.innerHTML = getElapsedTime(startTime);
    h3NumLumps.innerHTML = `BULBS USED: ${numLamps}`;
    isPaused = false;
    setInterval(() => {
        timeElapsed = h3Time.innerHTML = getElapsedTime(startTime);
    }, 1000);
}


function winCheck(cells) {
    console.log("winCheck was called");
    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];

        if (cell.dataset.type === "blank") {
            if (cell.dataset.lighten !== "1") {
                console.log("false returned bcs of darkness: ", cell.id);
                return false;
            }
            if (cell.dataset.red === "1") {
                console.log("false returned bcs of red: ", cell.id);
                return false;
            }
        }
        if (cell.dataset.type === "number") {
            if (cell.dataset.ready !== "1") {
                console.log("false returned (bcs of numbers): ", cell.id);
                return false;
            }
        }
    }
    console.log("returned true win!");
    return true;
}

function play() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener("click", () => {

            let cellReference = parseInt(cell.id);
            let cellIndexJ = cellReference % 10;
            let cellIndexI = (cellReference - cellReference % 10) / 10;

            if (cell.dataset.type === "blank" && cell.dataset.isLampPut === "0") {

                if (!checkBlocks(cellIndexI, cellIndexJ)) {
                    puzzle_error.play();
                }
                else {
                    let lampImg = document.createElement("img");
                    lampImg.src = "./pictures/lamp.png";
                    lampImg.className = "lamp";
                    cell.appendChild(lampImg);
                    cell.dataset.isLampPut = "1"; //true
                    numLamps++;
                    h3NumLumps.innerHTML = `Bulps Used: ${numLamps}`;

                    //light the corridors
                    light(cellIndexI, cellIndexJ);
                }

            }
            else if (cell.dataset.isLampPut === "1") {
                cell.innerHTML = ""; //lamp class named lamp img element also can be removed (later implement)
                cell.style.backgroundColor = "white";
                checkBlocksDec(cellIndexI, cellIndexJ);
                cell.dataset.isLampPut = "0" //false
                numLamps--;
                h3NumLumps.innerHTML = `Bulbs Used: ${numLamps}`;

                //deLight the corridors
                deLight(cellIndexI, cellIndexJ);
                reColor(); //recolor according to the update on the replacements of lamps
            }

            //winCheck
            if (winCheck(cells)) {
                updateAfterSolved();
                cells.forEach(cell => {
                    cell.style.pointerEvents = "none";
                })
            }
            else {
                h1WinMessage.innerHTML = "";
            }
        })
    })
}

function updateAfterSolved() {
    isPaused = true;
    h1WinMessage.innerHTML = "SOLVED!";

    if (currentGrid == easyGrid) level = "Easy";
    else if (currentGrid == mediumGrid) level = "Medium";
    else if (currentGrid == hardGrid) level = "Hard";
    else level = "Custom";
    //if (currentGrid == customGrid) level = "Custom Difficulty";

    saveGameData();

    let buttonRestart = document.createElement("button");
    buttonRestart.id = "restart_btn";
    buttonRestart.innerHTML = "RESTART THE GAME IN THE SAME DIFFICULTY LEVEL";
    GAME_INFO.appendChild(buttonRestart);

    let buttonChangeDiff = document.createElement("button");
    buttonChangeDiff.id = "change_btn";
    buttonChangeDiff.innerHTML = "CHANGE THE DIFFICULTY LEVEL";
    GAME_INFO.appendChild(buttonChangeDiff);


    buttonRestart.addEventListener("click", (e) => {
        h1WinMessage.innerHTML = "";
        //resetting game state
        numLamps = 0;
        startTime = new Date();

        //remove all children
        let rows = document.querySelectorAll(".row");

        for (let i = 0; i < rows.length; i++) {
            rows[i].remove();
        }

        loadPlayPage();
        buttonChangeDiff.remove()
        buttonRestart.remove();
    })

    buttonChangeDiff.addEventListener("click", (e) => {
        divPlayPage.style.display = "none";
        divChangeDifficulty.style.display = "flex";
        h1WinMessage.innerHTML = "";

        //resetting game state
        numLamps = 0;
        startTime = new Date();

        //remove all children
        let rows = document.querySelectorAll(".row");

        for (let i = 0; i < rows.length; i++) {
            rows[i].remove();
        }

        buttonRestart.remove();
        buttonChangeDiff.remove();

        buttonChangeDiffStart.addEventListener("click", (e) => {
            e.preventDefault();


            if (document.querySelector(".h3AlertDiff") != undefined) {
                document.querySelector(".h3AlertDiff").remove();
            }

            if (document.getElementById("easyDiff").checked) {

                currentGrid = easyGrid;
                divChangeDifficulty.style.display = "none";
                loadPlayPage();
            }
            else if (document.getElementById("mediumDiff").checked) {
                currentGrid = mediumGrid;
                divChangeDifficulty.style.display = "none";
                loadPlayPage();
            }
            else if (document.getElementById("hardDiff").checked) {
                currentGrid = hardGrid;
                divChangeDifficulty.style.display = "none";
                loadPlayPage();
            }
            else if (document.getElementById("customDiff").checked) {
                divChangeDifficulty.style.display = "none";
                createCustomGrid();
            }
            else {
                let hh3AlertDiff3Alert = document.createElement("h3");
                h3AlertDiff.innerHTML = "Please, fill the given form to start.";
                h3AlertDiff.style.color = "red";
                h3AlertDiff.className = "h3AlertDiff"
                divStartPage.appendChild(h3AlertDiff);
            }

        })
    })
}

buttonStart.addEventListener("click", (e) => {
    e.preventDefault();
    if (document.querySelector(".h3Alert") != undefined) {
        document.querySelector(".h3Alert").remove();
    }

    playerName = document.querySelector("#inputName").value;

    if (playerName !== "") {

        if (document.getElementById("easy").checked) {

            divStartPage.style.display = "none";
            currentGrid = easyGrid;
            currentContainer = gridContainer;
            loadPlayPage();
        }
        else if (document.getElementById("medium").checked) {
            divStartPage.style.display = "none";
            currentGrid = mediumGrid;
            currentContainer = gridContainer;
            loadPlayPage();
        }
        else if (document.getElementById("hard").checked) {
            divStartPage.style.display = "none";
            currentGrid = hardGrid;
            currentContainer = gridContainer;
            loadPlayPage();
        }
        else if (document.getElementById("custom").checked) {
            currentContainer = divCustomGrid;
            divStartPage.style.display = "none";
            divCustomGridPage.style.display = "flex";
            createCustomGrid();
        }
    }
    else {
        let h3Alert = document.createElement("h3");
        h3Alert.innerHTML = "Please, fill the given form to start.";
        h3Alert.style.color = "red";
        h3Alert.className = "h3Alert"
        divStartPage.appendChild(h3Alert);
    }
})

document.addEventListener("DOMContentLoaded", () => {

    let table = document.createElement("table");
    table.id = "tableScoreBoard";

    let caption = document.createElement("caption");
    caption.innerHTML = "SCORE BOARD";

    let tr = document.createElement("tr");

    let th = document.createElement("th");
    th.innerHTML = "Player Name";
    tr.appendChild(th);

    th = document.createElement("th");
    th.innerHTML = "Level";
    tr.appendChild(th);

    th = document.createElement("th");
    th.innerHTML = "Time Elapsed";
    tr.appendChild(th);

    table.appendChild(tr);

    for (let i = 0; i < scoreBoard.length; i++) {
        let score = scoreBoard[i];

        let tr = document.createElement("tr");
        tr.id = score.playerName;

        let td = document.createElement("td");
        td.innerHTML = score.playerName;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = score.level;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = score.timeElapsed;
        tr.appendChild(td);

        table.appendChild(tr);
    }

    divScoreBoard.appendChild(table);


    /////custom grid side

    console.log("custom maps: ", customGrids);

    for (let i = 0; i < customGrids.length; i++) {
        let divCustomMap = document.createElement("button");

        divCustomMap.className = "customMap";
        divCustomMap.id = i;

        let h3Name = document.createElement("h3");
        h3Name.innerHTML = `Creater: ${customGrids[i].playerName}`;

        let h3Map = document.createElement("h3");
        h3Map.innerHTML = `Map: Custom${i + 1}`;


        divCustomMap.appendChild(h3Name);
        divCustomMap.appendChild(h3Name);

        divCustomMaps.appendChild(divCustomMap);
    }


    //choose custom
    document.querySelectorAll(".customMap").forEach(iteratedMap=> {
        iteratedMap.addEventListener("click", () => {
            divStartPage.style.display = "none";
            // console.log("mapin ozu: ", iteratedMap.map);
            currentGrid = customGrids[parseInt(iteratedMap.id)].map;
            currentContainer = gridContainer;
            loadPlayPage();

        })
    })
})

function getElapsedTime(startTime) {

    if (!isPaused) {
        endTime = new Date();

        let timeDiff = endTime.getTime() - startTime.getTime();

        timeDiff = timeDiff / 1000;

        let seconds = Math.floor(timeDiff % 60);
        let secondsAsString = seconds < 10 ? "0" + seconds : seconds + "";
        timeDiff = Math.floor(timeDiff / 60);
        let minutes = timeDiff % 60;

        let minutesAsString = minutes < 10 ? "0" + minutes : minutes + "";

        timeDiff = Math.floor(timeDiff / 60);

        let hours = timeDiff % 24;

        timeDiff = Math.floor(timeDiff / 24);

        let days = timeDiff;

        let totalHours = hours + (days * 24); // add days to hours
        let totalHoursAsString = totalHours < 10 ? "0" + totalHours : totalHours + "";

        if (totalHoursAsString === "00") {
            return minutesAsString + ":" + secondsAsString;
        } else {
            return totalHoursAsString + ":" + minutesAsString + ":" + secondsAsString;
        }
    }
    return timeElapsed;
}

function renderBoard() {
    currentContainer.style.gridTemplateRows = `repeat(${currentGrid.length},1fr)`;
    for (let i = 0; i < currentGrid.length; i++) {
        var row = document.createElement("div");

        row.className = 'row';

        for (let j = 0; j < currentGrid[i].length; j++) {

            var column = document.createElement("div");
            column.className = 'cell';

            if (currentGrid[i][j] == "") {
                column.style.backgroundColor = "white";
                column.dataset.type = "blank";
                column.dataset.isLampPut = "0"; //false
                column.dataset.red = "0";
            }
            else if (currentGrid[i][j] == "+") {
                column.style.backgroundColor = "black";
                column.dataset.type = "stone";
            }
            else if (!isNaN(parseInt(currentGrid[i][j]))) {
                column.style.backgroundColor = "black";
                column.innerHTML = `${parseInt(currentGrid[i][j])}`;

                if (column.innerHTML === "0") {
                    column.dataset.ready = "1";
                }

                column.dataset.type = "number";
                column.dataset.counter = "0";
                column.style.color = "white";
                column.style.fontWeight = "bold"
                column.style.fontSize = "10";
            }

            column.id = `${i}${j}`;
            row.appendChild(column);
        }
        currentContainer.appendChild(row);
    }

}

function checkBlocks(i, j) {

    let allowedPuts = [];

    const blocks = [
        document.getElementById(`${i - 1}${j}`),
        document.getElementById(`${i + 1}${j}`),
        document.getElementById(`${i}${j - 1}`),
        document.getElementById(`${i}${j + 1}`)
    ]
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        if (block == null) continue;
        if (block.dataset.type == "number") {

            if (!(parseInt(block.dataset.counter) < parseInt(block.innerHTML))) {
                return false;
            }
            else {
                allowedPuts.push(block);
            }
        }
    }

    allowedPuts.forEach((block) => {
        block.dataset.counter = `${parseInt(block.dataset.counter) + 1}`;
        if (block.dataset.counter == `${parseInt(block.innerHTML)}`) {
            block.style.backgroundColor = "green";
            block.dataset.ready = "1";
        }
    })

    return true;
}

function checkBlocksDec(i, j) {
    const blocks = [
        document.getElementById(`${i - 1}${j}`),
        document.getElementById(`${i + 1}${j}`),
        document.getElementById(`${i}${j - 1}`),
        document.getElementById(`${i}${j + 1}`)
    ]
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        if (block == null) continue;

        if (block.dataset.type == "number") {
            block.dataset.counter = `${parseInt(block.dataset.counter) - 1}`;
            block.style.backgroundColor = "black";
            block.dataset.ready = "0";
        }
    }
}

function light(cellIndexI, cellIndexJ) {
    //column based coloring
    let lampCell = document.getElementById(`${cellIndexI}${cellIndexJ}`);
    lampCell.style.backgroundColor = "yellow";
    lampCell.dataset.lighten = "1";

    for (let i = cellIndexI - 1; i >= 0; i--) { //up coloring
        let cell = document.getElementById(`${i}${cellIndexJ}`)
        cell.dataset.red = "0";
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "yellow";
            cell.dataset.lighten = "1";

            if (cell.dataset.isLampPut === "1") {
                document.getElementById(`${cellIndexI}${cellIndexJ}`).style.backgroundColor = "red"; //the light generator lamp
                cell.style.backgroundColor = "red"; //the other lamp
                cell.dataset.red = "1";
                puzzle_error.play();
            }
        }
        else {
            break;
        }
    }

    for (let i = cellIndexI + 1; i < currentGrid.length; i++) { //down coloring
        let cell = document.getElementById(`${i}${cellIndexJ}`);
        cell.dataset.red = "0";
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "yellow";
            cell.dataset.lighten = "1";

            if (cell.dataset.isLampPut === "1") {
                document.getElementById(`${cellIndexI}${cellIndexJ}`).style.backgroundColor = "red"; //the light generator lamp
                cell.style.backgroundColor = "red"; //the other lamp
                cell.dataset.red = "1";
                puzzle_error.play();
            }
        }
        else {
            break;
        }
    }

    //row based coloring
    for (let j = cellIndexJ - 1; j >= 0; j--) {
        let cell = document.getElementById(`${cellIndexI}${j}`) //left coloring
        cell.dataset.red = "0";
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "yellow";
            cell.dataset.lighten = "1";

            if (cell.dataset.isLampPut === "1") {
                document.getElementById(`${cellIndexI}${cellIndexJ}`).style.backgroundColor = "red"; //the light generator lamp
                cell.style.backgroundColor = "red"; //the other lamp
                cell.dataset.red = "1";
                puzzle_error.play();
            }
        }
        else {
            break;
        }
    }

    for (let j = cellIndexJ + 1; j < currentGrid.length; j++) { ///right coloring
        let cell = document.getElementById(`${cellIndexI}${j}`)
        cell.dataset.red = "0";
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "yellow";
            cell.dataset.lighten = "1";

            if (cell.dataset.isLampPut === "1") {
                document.getElementById(`${cellIndexI}${cellIndexJ}`).style.backgroundColor = "red"; //the light generator lamp
                cell.style.backgroundColor = "red"; //the other lamp
                cell.dataset.red = "1";
                puzzle_error.play();
            }
        }
        else {
            break;
        }
    }
}

function deLight(cellIndexI, cellIndexJ) {
    //column based decoloring
    for (let i = cellIndexI - 1; i >= 0; i--) { //up decoloring
        let cell = document.getElementById(`${i}${cellIndexJ}`);
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "white";
            cell.dataset.lighten = "0";
            cell.dataset.red = "0";
        }
        else {
            break;
        }
    }

    for (let i = cellIndexI + 1; i < currentGrid.length; i++) { //down decoloring
        let cell = document.getElementById(`${i}${cellIndexJ}`)
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "white";
            cell.dataset.lighten = "0";
            cell.dataset.red = "0";
        }
        else {
            break;
        }
    }

    //row based decoloring
    for (let j = cellIndexJ - 1; j >= 0; j--) { //left decoloring
        let cell = document.getElementById(`${cellIndexI}${j}`)
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "white";
            cell.dataset.lighten = "0";
            cell.dataset.red = "0";
        }
        else {
            break;
        }
    }

    for (let j = cellIndexJ + 1; j < currentGrid.length; j++) { //right decoloring
        let cell = document.getElementById(`${cellIndexI}${j}`)
        if (cell.dataset.type === "blank") {
            cell.style.backgroundColor = "white";
            cell.dataset.lighten = "0";
            cell.dataset.red = "0";
        }
        else {
            break;
        }
    }
}

function reColor() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (cell.dataset.isLampPut === "1") {
            let cellReference = parseInt(cell.id);
            let cellIndexJ = cellReference % 10;
            let cellIndexI = (cellReference - cellReference % 10) / 10;
            light(cellIndexI, cellIndexJ);
        }
    })
}

score_btn.addEventListener("click", () => {
    if (!isScore) {
        divScoreBoard.style.display = "block";
        divCustomMaps.style.display = "none";
        IMG.style.display = "none";
        isScore = true;
    } else {
        divScoreBoard.style.display = "none";
        divCustomMaps.style.display = "none";
        IMG.style.display = "block";
        isScore = false;
    }
})

custom_btn.addEventListener("click", () => {
    if (!isCustom) {
        divCustomMaps.style.display = "block";
        divScoreBoard.style.display = "none";
        IMG.style.display = "none";
        isCustom = true;
    } else {
        divScoreBoard.style.display = "none";
        divCustomMaps.style.display = "none";
        IMG.style.display = "block";
        isCustom = false;
    }
})


let choosenElement;
let customGrid;

function createCustomGrid() {
    inputGridSize.addEventListener("input", (e) => {

        if (document.querySelector("#divCustomGrid") != undefined) document.querySelector("#divCustomGrid").remove();

        //creating an array of the input grid size
        let gridSize = parseInt(inputGridSize.value);
        customGrid = [];
        customGrid = new Array(gridSize);
        for (let i = 0; i < gridSize; i++) {
            customGrid[i] = new Array(gridSize).fill("");
        }

        //assigning currentGrid array
        currentGrid = customGrid;

        divCustomGrid = document.createElement("div");
        divCustomGrid.style.display = "flex";
        divCustomGrid = document.createElement("div");
        divCustomGrid.id = "divCustomGrid";
        divEditCustomGrid.appendChild(divCustomGrid);


        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];

            element.addEventListener("click", () => {
                choosenElement = element;
            })
        }
        currentContainer = divCustomGrid;
        renderBoard();
        changeElement();
    })

    buttonSetGrid.addEventListener("click", (e) => {
        e.preventDefault();
        if (customGrid.length !== 0) {
            divCustomGridPage.style.display = "none";
            divPlayPage.style.display = "flex";
            currentGrid = customGrid;
            currentContainer = gridContainer;
            divCustomGrid.remove();

            console.log("customGrid: ", customGrid);

            saveCustomMap();
            loadPlayPage();

            console.log(gridContainer);
        }
    })
}

function changeElement() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
        let cellReference = parseInt(cell.id);
        let cellIndexJ = cellReference % 10;
        let cellIndexI = (cellReference - cellReference % 10) / 10;
        cell.addEventListener("click", function clickElement() {
            if (choosenElement.dataset.type === "stone") {
                cell.style.backgroundColor = "black";
                cell.dataset.type = "stone";
                customGrid[cellIndexI][cellIndexJ] = "+";
            }
            else if (choosenElement.dataset.type === "number0") {
                cell.style.backgroundColor = "black";
                cell.dataset.type = "number";
                cell.innerHTML = "0";
                customGrid[cellIndexI][cellIndexJ] = "0";
            }
            else if (choosenElement.dataset.type === "number1") {
                cell.style.backgroundColor = "black";
                cell.dataset.type = "number";
                cell.innerHTML = "1";
                customGrid[cellIndexI][cellIndexJ] = "1";
            }
            else if (choosenElement.dataset.type === "number2") {
                cell.style.backgroundColor = "black";
                cell.dataset.type = "number";
                cell.innerHTML = "2";
                customGrid[cellIndexI][cellIndexJ] = "2";
            }
            else if (choosenElement.dataset.type === "number3") {
                cell.style.backgroundColor = "black";
                cell.dataset.type = "number";
                cell.innerHTML = "3";
                customGrid[cellIndexI][cellIndexJ] = "3";
            }
            else if (choosenElement.dataset.type === "empty") {
                cell.style.backgroundColor = "white";
                cell.dataset.type = "blank";
                cell.innerHTML = "";
                customGrid[cellIndexI][cellIndexJ] = "";
            }
        })
    })
}