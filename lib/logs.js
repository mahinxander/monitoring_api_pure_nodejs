/**
 * Title: Logs
 * Description: Handle logs
 * Author: Mahin
 */

//dependencies
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

//module scaffolding
const lib = {};

//base directory of the logs folder
lib.baseDir = path.join(__dirname, "/../.logs/");
// console.log(lib.baseDir);

//append a string to a file. Create the file if it does not exist
lib.append = (file, str, callback) => {
    //open the file for appending
    fs.open(`${lib.baseDir + file}.log`, "a", (err, fileDescriptor) => {

        if (!err && fileDescriptor) {
            //append to file and close it
            fs.appendFile(fileDescriptor, `${str}\n`, (err2) => {
                if (!err2) {
                    fs.close(fileDescriptor, (err3) => {
                        if (!err3) {
                            callback(false);
                        } else {
                            callback("Error closing file that was being appended");
                        }
                    });
                } else {
                    callback("Error appending to file");
                }
            });
        } else {
            callback("Could not open file for appending");
        }
    });
}

//list all the logs and optionally include the compressed logs
lib.list = (includeCompressedLogs, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
        if (!err && data && data.length > 0) {
            const trimmedFileNames = [];
            data.forEach((fileName) => {
                //add the .log files
                if (fileName.indexOf(".log") > -1) {
                    trimmedFileNames.push(fileName.replace(".log", ""));
                }

                //add the .gz files
                if (fileName.indexOf(".gz.b64") > -1 && includeCompressedLogs) {
                    trimmedFileNames.push(fileName.replace(".gz.b64", ""));
                }
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, data);
        }
    });
}

//compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = (logId, newFileId, callback) => {
    //file name
    const sourceFile = `${logId}.log`;
    const destFile = `${newFileId}.gz.b64`;

    //read the source file
    fs.readFile(`${lib.baseDir + sourceFile}`, "utf8", (err, inputString) => {
        if (!err && inputString) {
            //compress the data using gzip
            zlib.gzip(inputString, (err2, buffer) => {
                if (!err2 && buffer) {
                    //send the data to the destination file
                    fs.open(`${lib.baseDir + destFile}`, "wx", (err3, fileDescriptor) => {
                        if (!err3 && fileDescriptor) {
                            //write to the destination file
                            fs.writeFile(fileDescriptor, buffer.toString("base64"), (err4) => {
                                if (!err4) {
                                    //close the destination file
                                    fs.close(fileDescriptor, (err5) => {
                                        if (!err5) {
                                            callback(false);
                                        } else {
                                            callback(err5);
                                        }
                                    });
                                } else {
                                    callback(err4);
                                }
                            });
                        } else {
                            callback(err3);
                        }
                    });
                } else {
                    callback(err2);
                }
            });
        } else {
            callback(err);
        }
    }
    );
}

//decompress the contents of a .gz.b64 file into a string variable
lib.decompress = (fileId, callback) => {
    const fileName = `${fileId}.gz.b64`;
    fs.readFile(`${lib.baseDir + fileName}`, "utf8", (err, str) => {
        if (!err && str) {
            //decompress the data
            const inputBuffer = Buffer.from(str, "base64");
            zlib.unzip(inputBuffer, (err2, outputBuffer) => {
                if (!err2 && outputBuffer) {
                    //callback
                    const str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err2);
                }
            });
        } else {
            callback(err);
        }
    });
}

//truncate a log file
lib.truncate = (logId, callback) => {
    fs.truncate(`${lib.baseDir + logId}.log`, 0, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback(err);
        }
    });
}

//export module
module.exports = lib;
