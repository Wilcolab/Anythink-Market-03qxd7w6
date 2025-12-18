'use strict';

var value = 0;

var states = {
    "start": 0,
    "operand1": 1,
    "operator": 2,
    "operand2": 3,
    "complete": 4
};

var state = states.start;

var operand1 = 0;
var operand2 = 0;
var operation = null;

function calculate(operand1, operand2, operation) {
    var uri = location.origin + "/arithmetic";

    // TODO: Add operator
    switch (operation) {
        case '+':
            uri += "?operation=add";
            break;
        case '-':
            uri += "?operation=subtract";
            break;
        case '*':
            uri += "?operation=multiply";
            break;
        case '/':
            uri += "?operation=divide";
            break;
        case '^':
            uri += "?operation=power"; // Exponentiation operation
            break;
        default:
            setError();
            return;
    }

    uri += "&operand1=" + encodeURIComponent(operand1);
    uri += "&operand2=" + encodeURIComponent(operand2);

    setLoading(true);

    var http = new XMLHttpRequest();
    http.open("GET", uri, true);
    http.onload = function () {
        setLoading(false);

        if (http.status == 200) {
            var response = JSON.parse(http.responseText);
            setValue(response.result);
        } else {
            setError();
        }
    };
    http.send(null);
}

function clearPressed() {
    setValue(0);

    operand1 = 0;
    operand2 = 0;
    operation = null;
    state = states.start;
}

function clearEntryPressed() {
    setValue(0);
    state = (state == states.operand2) ? states.operator : states.start;
}

function numberPressed(n) {
    var value = getValue();

    if (state == states.start || state == states.complete) {
        value = n;
        state = (n == '0' ? states.start : states.operand1);
    } else if (state == states.operator) {
        value = n;
        state = (n == '0' ? states.operator : states.operand2);
    } else if (value.replace(/[-\.]/g, '').length < 8) {
        value += n;
    }

    value += "";

    setValue(value);
}

function decimalPressed() {
    if (state == states.start || state == states.complete) {
        setValue('0.');
        state = states.operand1;
    } else if (state == states.operator) {
        setValue('0.');
        state = states.operand2;
    } else if (!getValue().toString().includes('.')) {
        setValue(getValue() + '.');
    }
}

function signPressed() {
    var value = getValue();

    if (value != 0) {
        setValue(-1 * value);
    }
}

function operationPressed(op) {
    operand1 = getValue();
    operation = op;
    state = states.operator;
}

function equalPressed() {
    if (state < states.operand2) {
        state = states.complete;
        return;
    }

    if (state == states.operand2) {
        operand2 = getValue();
        state = states.complete;
    } else if (state == states.complete) {
        operand1 = getValue();
    }

    calculate(operand1, operand2, operation);
}

// TODO: Add key press logics
document.addEventListener('keypress', (event) => {
    if (event.key.match(/^\d+$/)) {
        numberPressed(event.key);
    } else if (event.key == '.') {
        decimalPressed();
    } else if (event.key.match(/^[-*+/^]$/)) {
        operationPressed(event.key);
    } else if (event.key == '=') {
        equalPressed();
    }
});

function getValue() {
    return value;
}

function setValue(n) {
    value = n;
    var displayValue = value;

    if (displayValue > 99999999) {
        displayValue = displayValue.toExponential(4);
    } else if (displayValue < -99999999) {
        displayValue = displayValue.toExponential(4);
    } else if (displayValue > 0 && displayValue < 0.0000001) {
        displayValue = displayValue.toExponential(4);
    } else if (displayValue < 0 && displayValue > -0.0000001) {
        displayValue = displayValue.toExponential(3);
    }

    var chars = displayValue.toString().split("");
    var html = "";

    for (var c of chars) {
        if (c == '-') {
            html += "<span class=\"resultchar negative\">" + c + "</span>";
        } else if (c == '.') {
            html += "<span class=\"resultchar decimal\">" + c + "</span>";
        } else if (c == 'e') {
            html += "<span class=\"resultchar exponent\">e</span>";
        } else if (c != '+') {
            html += "<span class=\"resultchar digit" + c + "\">" + c + "</span>";
        }
    }

    document.getElementById("result").innerHTML = html;
}

function setError(n) {
    document.getElementById("result").innerHTML = "ERROR";
}

function setLoading(loading) {
    if (loading) {
        document.getElementById("loading").style.visibility = "visible";
    } else {
        document.getElementById("loading").style.visibility = "hidden";
    }

    var buttons = document.querySelectorAll("BUTTON");

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = loading;
    }
}

function submitFeedback() {
    var feedback = document.getElementById("feedback-text").value;
    if (feedback.trim() === "") {
        alert("Please enter some feedback.");
        return;
    }
    // Send to server
    fetch('/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback: feedback })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert("Thank you for your feedback!");
            document.getElementById("feedback-text").value = "";
            currentFeedbackPage = 1;
            loadFeedbacks(); // Refresh the list
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Failed to submit feedback. Please try again.");
    });
}

var currentFeedbackPage = 1;

function loadFeedbacks(page = 1) {
    fetch(`/feedback?page=${page}&limit=5`)
    .then(response => response.json())
    .then(data => {
        const list = document.getElementById("feedback-list");
        if (page === 1) {
            list.innerHTML = "";
        }
        data.feedbacks.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${new Date(item.timestamp).toLocaleString()}: ${item.feedback}`;
            list.appendChild(li);
        });
        // Hide load more if no more feedbacks
        document.getElementById("load-more-btn").style.display = data.feedbacks.length < 5 ? 'none' : 'block';
    })
    .catch(error => console.error('Error loading feedbacks:', error));
}

function loadMoreFeedbacks() {
    currentFeedbackPage++;
    loadFeedbacks(currentFeedbackPage);
}
