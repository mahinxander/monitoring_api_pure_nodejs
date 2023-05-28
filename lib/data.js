/**
 * Title: Data
 * Description: File for storing and editing data
 * Author: Mahin
 */

//Dependencies
const fs = require("fs");
const path = require("path");

//Module scaffolding
const lib = {};

//Base directory of the data folder
lib.basedir = path.join(__dirname, "/../.data/");

//Write data to file
lib.create = (dir, file, data, callback) => {
    //Open file for writing
    fs.open(`${lib.basedir + dir}/${file}.json`, "wx", (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //Convert data to string
            const stringData = JSON.stringify(data);

            //Write data to file and close it
            fs.writeFile(fileDescriptor, stringData, (err2) => {

                if (!err2) {
                    fs.close(fileDescriptor, (err3) => {
                        if (!err3) {
                            callback(false);
                        } else {
                            callback("Error closing new file");
                        }
                    });
                } else {
                    callback("Error writing to new file");
                }
            });
        } else {
            callback(err);

        }
    });
}

//Read data from file
lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.basedir + dir}/${file}.json`, "utf8", (err, data) => {
        callback(err, data);
    });
}

//Update existing file
lib.update = (dir, file, data, callback) => {
    //File open for writing
    fs.open(`${lib.basedir + dir}/${file}.json`, "r+", (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //Convert data to string
            const stringData = JSON.stringify(data);

            //Truncate the file
            fs.ftruncate(fileDescriptor, (err1) => {
                if (!err1) {
                    //Write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, (err2) => {
                        if (!err2) {
                            fs.close(fileDescriptor, (err3) => {
                                if (!err3) {
                                    callback(false);
                                } else {
                                    callback("Error closing file");
                                }
                            });
                        } else {
                            callback("Error writing to file");
                        }
                    });
                } else {
                    callback("Error truncating file");
                }
            });
        } else {
            callback("Error updating. File may not exist");
        }
    });
}

//Delete existing file
lib.delete = (dir, file, callback) => {

    //Unlink the file from the filesystem
    fs.unlink(`${lib.basedir + dir}/${file}.json`, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback("Error deleting file");
        }
    });
}

lib.rename = (dir, oldFile, newFile, callback) => {
    fs.rename(`${lib.basedir + dir}/${oldFile}.json`, `${lib.basedir + dir}/${newFile}.json`, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback(true);
        }
    });
}

//List all the items in a directory
lib.list = (dir, callback) => {
    fs.readdir(`${lib.basedir + dir}/`, (err, fileNames) => {
        if (!err && fileNames && fileNames.length > 0) {
            let trimmedFileNames = [];
            fileNames.forEach((fileName) => {
                trimmedFileNames.push(fileName.replace(".json", ""));
            });
            callback(false, trimmedFileNames);
        } else {
            callback(err, fileNames);
        }
    });
}

//Export module
module.exports = lib;

