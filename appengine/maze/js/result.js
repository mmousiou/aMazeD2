'use strict';

const levelData = [{
    name: "Επίπεδο 1",
    runClick: 0,
    time: "0",
    result: "",
    score: 0,
    code: ""
}, {
    name: "Επίπεδο 2",
    runClick: 0,
    time: "0",
    result: "",
    score: 0,
    code: ""
}, {
    name: "Επίπεδο 3",
    runClick: 0,
    time: "0",
    result: "",
    score: 0,
    code: ""
}, {
    name: "Επίπεδο 4",
    runClick: 0,
    time: "0",
    result: "",
    score: 0,
    code: ""
}, {
    name: "Επίπεδο 5",
    runClick: 0,
    time: "0",
    result: "",
    score: 0,
    code: ""
}, {
    name: "Επίπεδο 6",
    runClick: 0,
    time: "0",
    result: "",
    score: 0,
    code: ""
}, {
    name: "Επίπεδο 7",
    runClick: 0,
    time: "0",
    result: "",
    score: 0,
    code: ""
}, ];


//εμφάνισε στοιχεία πίνακα
for (let i = 0; i < levelData.length; i++) {
    let temp = i + 1;
    let name = "maze_level" + temp;
    let codeLevel = 'maze-code' + temp;

    let playid = "play-" + temp;
    let timeid = "time-" + temp;
    let resultid = "result-" + temp;
    let scoreid = "score-" + temp;
    let result = '';
    let codeid = 'code-' + temp;
    let data = JSON.parse(window.localStorage.getItem(name));
    console.log(data);
    let code = window.localStorage.getItem(codeLevel);
    if (data) levelData[i] = data;
    //όταν αλλάζω τη βοήθεια αλλάζει το όνομα του μετρητή σοκ!! Να ελέγχεις πάντα από κονσόλα το όνομα
    document.getElementById(playid).textContent = levelData[i].Vf;
    console.log(levelData[i].Vf);
    document.getElementById(timeid).textContent = levelData[i].time;
    if (levelData[i].result == 'Failure') {
        result = 'Αποτυχία';
    } else {
        result = 'Επιτυχία';
    }
    document.getElementById(resultid).textContent = result;
    document.getElementById(scoreid).textContent = levelData[i].pc;

    // για να εμφανίσει σωστά τον κώδικα!!!
    if (code) {
        levelData[i].code = code;
        document.getElementById(codeid).innerText = code;
    }
}

// εμφάνισε total-score
const totalScore = window.localStorage.getItem("total-score");
document.getElementById(
    "total-score"
).textContent = totalScore;

console.log(levelData);

// κουμπί για μετάβαση σε νέο παιχνίδι και καθαρισμό δεδομένων 
document.getElementById("clear").addEventListener("click", function() {
    window.localStorage.clear();
    window.location = "maze.html";
});

// ανάκτηση στοιχείων Φόρμας 
document.getElementById('save-btn').addEventListener('click', function() {
    //prevent form from submitting
    // e.preventDefault();
    let userName = document.getElementById('name').value;
    let userEmail = document.getElementById('myemail').value;
    console.log(userName, userEmail);
    window.localStorage.setItem('name', userName);
    window.localStorage.setItem('email', userEmail);
});

if (window.localStorage.getItem('name')) {
    document.getElementById('app').style.opacity = 100;
}



//για να κάνουμε εξαγωγή τα αποτελέσματα σε πίνακα του excell !!

function exportTableToExcel(tableID, filename = '') {
    var downloadLink;
    var dataType = 'application/vnd.ms-excel';
    var tableSelect = document.getElementById(tableID);
    var tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

    // Specify file name
    filename = filename ? filename + '.xls' : 'excel_data.xls';

    // Create download link element
    downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if (navigator.msSaveOrOpenBlob) {
        var blob = new Blob(['\ufeff', tableHTML], {
            type: dataType
        });
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        // Create a link to the file
        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;

        // Setting the file name
        downloadLink.download = filename;

        //triggering the function
        downloadLink.click();
    }
}
// ημερομηνία : 
const now = new Date();
const options = {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    // weekday: 'long',
};
// const locale = navigator.language;
// console.log(locale);
/* const labelDate = document.querySelector(".date"); */
const labelDate = new Intl.DateTimeFormat(
    'el-GR',
    options
).format(now);

//εμφάνισε όνομα και email στην πρώτη γραμμή του πίνακα

const getName = window.localStorage.getItem('name');
const getEmail = window.localStorage.getItem('email');
const capTxt = 'Στοιχεία χρήστη --> Ονοματεπώνυμο: ' + getName + ' , e-mail: ' + getEmail + ' , Score: ' + totalScore + ' , Ημερ/νια: ' + labelDate;
console.log(capTxt);
document.getElementById('caption--text').innerHTML = capTxt;