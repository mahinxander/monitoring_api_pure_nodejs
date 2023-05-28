/**
 * Title: Workers Library
 * Description: Worker Related file
 * Author: Mahin Rahman
 */

//Dependencies
let data = require("./data");
const { parseJSON } = require("../helpers/utilities");
let url = require("url");
const { sendTwilioSms } = require("../helpers/notifications");
const https = require("https");
const http = require("http");
const _logs = require("./logs");


//server object - module scaffolding
const worker = {};

//gather all the checks
worker.gatherAllChecks = () => {
    //get all the checks
    data.list("checks", (err1, checks) => {
        if (!err1 && checks && checks.length > 0) {
            let counter = 0;
            checks.forEach((check) => {
                counter++;
                //read the check data
                data.read("checks", check, (err2, originalCheckData) => {
                    if (!err2 && originalCheckData) {
                        //pass the data to the check validator
                        console.log(`LOOP: ${counter}`);
                        worker.validateCheckData(parseJSON(originalCheckData));
                    } else {
                        console.log("Error reading one of the check's data");
                        console.log(err2);
                    }
                });
            });
        } else {
            console.log("Error: Could not find any checks to process");
            console.log(err1);
        }
    });
}

//sanity-check the check-data
worker.validateCheckData = (originalCheckData) => {
    const originalData = typeof (originalCheckData) === "object"
        && originalCheckData !== null ? originalCheckData : {};
    originalData.id = typeof (originalCheckData.id) === "string"
        && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false;
    originalData.userPhone = typeof (originalCheckData.userPhone) === "string"
        && originalCheckData.userPhone.trim().length === 11 ? originalCheckData.userPhone.trim() : false;
    originalData.protocol = typeof (originalCheckData.protocol) === "string"
        && ["http", "https"].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalData.url = typeof (originalCheckData.url) === "string"
        && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalData.method = typeof (originalCheckData.method) === "string"
        && ["get", "post", "put", "delete"].indexOf(originalCheckData.method.toLowerCase()) > -1 ? originalCheckData.method : false;
    originalData.successCodes = typeof (originalCheckData.successCodes) === "object"
        && originalCheckData.successCodes instanceof Array
        && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) === "number"
        && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1
        && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    //set the keys that may not be set (if the workers have never seen this check before)
    originalData.state = typeof (originalCheckData.state) === "string"
        && ["up", "down"].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : "down";
    originalData.lastChecked = typeof (originalCheckData.lastChecked) === "number"
        && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    //if all the checks pass, pass the data along to the next step in the process
    if (originalData.id &&
        originalData.userPhone &&
        originalData.protocol &&
        originalData.url &&
        originalData.method &&
        originalData.successCodes &&
        originalData.timeoutSeconds) {
        worker.performCheck(originalData);
    } else {
        console.log("Error: One of the checks is not properly formatted. Skipping it.");
    }
}

//perform the check, send the originalCheckData and the outcome of the check process to the next step in the process
worker.performCheck = (originalCheckData) => {
    //prepare the initial check outcome
    let checkOutcome = {
        "error": false,
        "responseCode": false
    };

    //mark that the outcome has not been sent yet
    let outcomeSent = false;

    //parse the hostname and the path out of the original check data
    let parsedUrl = url.parse(originalCheckData.protocol + "://" + originalCheckData.url, true);
    let hostName = parsedUrl.hostname;
    let path = parsedUrl.path; //using path and not "pathname" because we want the query string

    //construct the request
    let requestDetails = {
        "protocol": originalCheckData.protocol + ":",
        "hostname": hostName,
        "method": originalCheckData.method.toUpperCase(),
        "path": path,
        "timeout": originalCheckData.timeoutSeconds * 2000
    };

    //instantiate the request object (using either the http or https module)
    let _moduleToUse = originalCheckData.protocol === "http" ? http : https;
    let req = _moduleToUse.request(requestDetails, (res) => {
        //grab the status of the sent request
        const status = res.statusCode;

        //update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    //bind to the error event so it doesn't get thrown
    req.on("error", (e) => {
        //update the checkOutcome and pass the data along
        checkOutcome.error = {
            "error": true,
            "value": e
        };
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    //bind to the timeout event
    req.on("timeout", (e) => {
        //update the checkOutcome and pass the data along
        checkOutcome.error = {
            "error": true,
            "value": "timeout"
        };
        if (!outcomeSent) {
            worker.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    //end the request
    req.end();
}


//process the check outcome and update the check data as needed, trigger an alert to the user if needed
//special logic for accomodating a check that has never been tested before (don't alert on that one)
worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
    //decide if the check is considered up or down
    let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? "up" : "down";

    //decide if an alert is warranted
    let alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    //log the outcome
    let timeOfCheck = Date.now();
    worker.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

    //update the check data
    let newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    //save the updates
    data.update("checks", newCheckData.id, newCheckData, (err) => {
        if (!err) {
            //send the new check data to the next phase in the process if needed
            if (alertWarranted) {
                worker.alertUserToStatusChange(newCheckData);
            } else {
                console.log("Check outcome has not changed, no alert needed");
            }
        } else {
            console.log("Error trying to save updates to one of the checks");
        }
    });
}

//alert the user as to a change in their check status
worker.alertUserToStatusChange = (newCheckData) => {
    let msg = "Alert: Your check for " + newCheckData.method.toUpperCase() + " " + newCheckData.protocol + "://" + newCheckData.url + " is currently " + newCheckData.state;
    sendTwilioSms(newCheckData.userPhone, msg, (err) => { //use verifed phone number as per Twilio's rules
        if (!err) {
            console.log("Success: User was alerted to a status change in their check, via sms: ", msg);
        } else {
            console.log("Error: Could not send sms alert to user who had a state change in their check", err);
        }
    });
}

worker.log = (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) => {
    // form the log data
    let logData = {
        "check": originalCheckData,
        "outcome": checkOutcome,
        "state": state,
        "alert": alertWarranted,
        "time": timeOfCheck
    };

    //convert data to a string
    let logString = JSON.stringify(logData);

    //determine the name of the log file
    let logFileName = originalCheckData.id;

    //append the log string to the file
    _logs.append(logFileName, logString, (err) => {
        if (!err) {
            console.log("Logging to file succeeded");
        } else {
            console.log("Logging to file failed");
        }
    });

}

//timer to execute the worker-process once per minute
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks();
        // }, 3000 * 60);
    }, 1000 * 60 * 30);
}

//rotate (compress) the log files
worker.rotateLogs = () => {
    //list all the (non compressed) log files
    _logs.list(false, (err, logs) => {
        if (!err && logs && logs.length > 0) {
            logs.forEach((logName) => {
                //compress the data to a different file
                let logId = logName.replace(".log", "");
                let newFileId = logId + "-" + Date.now();
                _logs.compress(logId, newFileId, (err) => {
                    if (!err) {
                        //truncate the log
                        _logs.truncate(logId, (err) => {
                            if (!err) {
                                console.log("Success truncating log file");
                            } else {
                                console.log("Error truncating log file");
                            }
                        });
                    } else {
                        console.log("Error compressing one of the log files", err);
                    }
                });
            });
        } else {
            console.log("Error: Could not find any logs to rotate");
        }
    });
}

//timer to execute the log-rotation process once per day
worker.logRotationLoop = () => {
    setInterval(() => {
        worker.rotateLogs();
    }, 1000 * 60 * 60 * 24);
}

//init script
worker.init = () => {
    //send to console in yellow
    // console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

    //execute all the checks immediately
    worker.gatherAllChecks();

    //call the loop so the checks will execute later on
    worker.loop();

    //compress all the logs immediately
    worker.rotateLogs();

    //call the compression loop so logs will be compressed later on
    worker.logRotationLoop();

}

//export the module
module.exports = worker;
