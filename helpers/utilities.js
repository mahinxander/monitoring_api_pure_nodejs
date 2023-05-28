/**
 * Title: Utilities
 * Description: Important utility functions
 * Author: Mahin
 */

//dependencies
const crypto = require('crypto');
const utilities = {};
const environments = require('./environments');

//parse JSON string to object
utilities.parseJSON = (jsonString) => {
    let output;

    try {
        output = JSON.parse(jsonString);
    } catch {
        output = {};

    }

    return output;
}

//hashing string
utilities.hash = (str) => {
    if (typeof (str) === 'string' && str.length > 0) {
        let hash = crypto
            .createHmac('sha256', environments.secretKey)
            .update(str)
            .digest('hex');
        return hash;
    } else {
        return false;
    }
}

//create a random string
utilities.createRandomString = (strLength) => {
    let length = strLength;
    length = typeof (strLength) === 'number' && strLength > 0 ? strLength : false;
    if (length) {
        //define all the possible characters
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        //start the final string
        let output = '';
        for (let i = 1; i <= length; i++) {
            //get random character from the possibleCharacters string
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            //append this character to the output
            output += randomCharacter;
        }
        //return the output
        return output;
    } else {
        return false;
    }
}

//export the module
module.exports = utilities;