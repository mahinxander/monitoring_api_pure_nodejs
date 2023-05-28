/**
 * Title: Check Handler
 * Description: Handler to handle check related routes
 * Author: Mahin
 */

//dependencies
const data = require("../lib/data");
const { hash } = require("../helpers/utilities");
const { parseJSON } = require("../helpers/utilities");
const tokenHandler = require("./tokenHandler");
const { createRandomString } = require("../helpers/utilities");

//module scaffolding
const handler = {};

handler.checkHandler = (requestedProperties, callback) => {

    const acceptedMethods = ["get", "post", "put", "delete"];
    if (acceptedMethods.indexOf(requestedProperties.method) > -1) {
        handler._check[requestedProperties.method](requestedProperties, callback);
    } else {
        callback(405);
    }
};

handler._check = {};

handler._check.get = (requestedProperties, callback) => {
    //check the id if valid
    const id = typeof (requestedProperties.queryStringObject.id) === 'string'
        && requestedProperties.queryStringObject.id.trim().length === 20
        ? requestedProperties.queryStringObject.id : false;

    if (id) {
        //lookup the check
        data.read('checks', id, (err1, checkData) => {
            if (!err1 && checkData) {
                //verify the token
                const token = typeof (requestedProperties.headersObject.token) === 'string'
                    ? requestedProperties.headersObject.token : false;
                tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, parseJSON(checkData));
                    } else {
                        callback(403, {
                            error: 'Authentication failure!',
                        });
                    }
                });
            } else {
                callback(500, {
                    error: 'There was a problem in the server side!',
                });
            }
        });
    }
    else {
        callback(400, {
            error: 'You have a problem in your request!',
        });
    }

};

handler._check.post = (requestedProperties, callback) => {

    const protocol = typeof (requestedProperties.body.protocol) === 'string'
        && ['http', 'https'].indexOf(requestedProperties.body.protocol) > -1
        ? requestedProperties.body.protocol : false;

    const url = typeof (requestedProperties.body.url) === 'string'
        && requestedProperties.body.url.trim().length > 0
        ? requestedProperties.body.url : false;

    // const method = typeof (requestedProperties.body.method) === 'string'
    //     && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestedProperties.body.method.toUpperCase()) > -1
    //     ? requestedProperties.body.method : false;
    // console.log(method);
    const method = typeof (requestedProperties.body.method) === 'string'
        && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestedProperties.body.method) > -1
        ? requestedProperties.body.method : false;
    // console.log(method);

    const successCodes = typeof (requestedProperties.body.successCodes) === 'object'
        && requestedProperties.body.successCodes instanceof Array
        && requestedProperties.body.successCodes.length > 0
        ? requestedProperties.body.successCodes : false;

    const timeoutSeconds = typeof (requestedProperties.body.timeoutSeconds) === 'number'
        && requestedProperties.body.timeoutSeconds % 1 === 0
        && requestedProperties.body.timeoutSeconds >= 1
        && requestedProperties.body.timeoutSeconds <= 5
        ? requestedProperties.body.timeoutSeconds : false;


    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token = typeof (requestedProperties.headersObject.token) === 'string'
            ? requestedProperties.headersObject.token : false;

        //lookup the user phone by reading the token
        data.read('tokens', token, (err1, tokenData) => {
            if (!err1 && tokenData) {
                const userPhone = parseJSON(tokenData).phone;

                //lookup the user data
                data.read('users', userPhone, (err2, userData) => {
                    if (!err2 && userData) {
                        tokenHandler._token.verify(token, userPhone, (tokenId) => {
                            if (tokenId) {
                                const userObject = parseJSON(userData);
                                const userChecks = typeof (userObject.checks) === 'object'
                                    && userObject.checks instanceof Array
                                    ? userObject.checks : [];

                                if (userChecks.length < 5) {
                                    const checkId = createRandomString(20);
                                    const checkObject = {
                                        'id': checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds,
                                    };

                                    //save the object
                                    data.create('checks', checkId, checkObject, (err3) => {
                                        if (!err3) {
                                            //add check id to the user's object
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            //save the new user data
                                            data.update('users', userPhone, userObject, (err4) => {
                                                if (!err4) {
                                                    //return the data about the new check
                                                    callback(200, checkObject);
                                                } else {
                                                    callback(500, {
                                                        error: 'There was a problem in the server side!',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                error: 'There was a problem in the server side!',
                                            });
                                        }
                                    }
                                    );
                                } else {
                                    callback(401, {
                                        error: 'User has already reached max check limit!',
                                    });
                                }
                            } else {
                                callback(403, {
                                    error: 'Authentication problem!',
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'User not found!',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication problem!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'You have a problem in your request!',
        });
    }

};

handler._check.put = (requestedProperties, callback) => {
    //check the id if valid
    const id = typeof (requestedProperties.body.id) === 'string'
        && requestedProperties.body.id.trim().length === 20
        ? requestedProperties.body.id : false;

    //check for the optional fields
    const protocol = typeof (requestedProperties.body.protocol) === 'string'
        && ['http', 'https'].indexOf(requestedProperties.body.protocol) > -1
        ? requestedProperties.body.protocol : false;

    const url = typeof (requestedProperties.body.url) === 'string'
        && requestedProperties.body.url.trim().length > 0
        ? requestedProperties.body.url : false;

    const method = typeof (requestedProperties.body.method) === 'string'
        && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestedProperties.body.method) > -1
        ? requestedProperties.body.method : false;

    const successCodes = typeof (requestedProperties.body.successCodes) === 'object'
        && requestedProperties.body.successCodes instanceof Array
        && requestedProperties.body.successCodes.length > 0
        ? requestedProperties.body.successCodes : false;

    const timeoutSeconds = typeof (requestedProperties.body.timeoutSeconds) === 'number'
        && requestedProperties.body.timeoutSeconds % 1 === 0
        && requestedProperties.body.timeoutSeconds >= 1
        && requestedProperties.body.timeoutSeconds <= 5
        ? requestedProperties.body.timeoutSeconds : false;

    console.log(protocol, url, method, successCodes, timeoutSeconds);

    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            data.read('checks', id, (err1, checkData) => {
                if (!err1 && checkData) {
                    const checkObject = parseJSON(checkData);
                    const token = typeof (requestedProperties.headersObject.token) === 'string'
                        ? requestedProperties.headersObject.token : false;

                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkObject.protocol = protocol;
                            }
                            if (url) {
                                checkObject.url = url;
                            }
                            if (method) {
                                checkObject.method = method;
                            }
                            if (successCodes) {
                                checkObject.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkObject.timeoutSeconds = timeoutSeconds
                            }

                            //store the new updates
                            data.update('checks', id, checkObject, (err2) => {
                                if (!err2) {
                                    callback(200, {
                                        success: 'Check updated successfully!',
                                        ...checkObject
                                    });
                                } else {
                                    callback(500, {
                                        error: 'There was a problem in the server side!',
                                    });
                                }
                            }
                            );
                        } else {
                            callback(403, {
                                error: 'Authentication problem!',
                            });
                        }
                    });
                } else {
                    callback(500, {
                        error: 'There was a problem in the server side!',
                    });
                }
            });
        } else {
            callback(400, {
                error: 'You must provide at least one field to update!',
            });
        }
    } else {
        callback(400, {
            error: 'You have a problem in your request!',
        });
    }

};

handler._check.delete = (requestedProperties, callback) => {
    //check if the phone number is valid
    const id = typeof (requestedProperties.queryStringObject.id) === 'string'
        && requestedProperties.queryStringObject.id.trim().length === 20
        ? requestedProperties.queryStringObject.id : false;

    if (id) {
        //lookup the check
        data.read('checks', id, (err1, checkData) => {
            if (!err1 && checkData) {
                const token = typeof (requestedProperties.headersObject.token) === 'string'
                    ? requestedProperties.headersObject.token : false;

                tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        //delete the check data
                        data.delete('checks', id, (err2) => {
                            if (!err2) {
                                //lookup the user
                                data.read('users', parseJSON(checkData).userPhone, (err3, userData) => {
                                    const userObject = parseJSON(userData);
                                    if (!err3 && userData) {
                                        const userChecks = typeof (userObject.checks) === 'object'
                                            && userObject.checks instanceof Array
                                            ? userObject.checks : [];

                                        //remove the deleted check id from user's list of checks
                                        const checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            //resave the user data
                                            userObject.checks = userChecks;
                                            data.update('users', userObject.phone, userObject, (err4) => {
                                                if (!err4) {
                                                    callback(200, {
                                                        success: 'Check deleted successfully!',
                                                    });
                                                } else {
                                                    callback(500, {
                                                        error: 'There was a server side error!',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                error: 'The check id that you are trying to remove is not found in user!',
                                            });
                                        }
                                    } else {
                                        callback(500, {
                                            error: 'There was a server side error!',
                                        });
                                    }
                                });
                            } else {
                                callback(500, {
                                    error: 'There was a server side error!',
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'Authentication failure!',
                        });
                    }
                });
            } else {
                callback(500, {
                    error: 'There was an error!',
                    errorMesssage: err1.message,
                    errorObject: err1
                });
            }
        });
    } else {
        callback(400, {
            error: 'You have a problem in your request!',
        });
    }

};


module.exports = handler;