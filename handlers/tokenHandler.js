/**
 * Title: Token Handler
 * Description: Handler to handle token related routes
 * Author: Mahin
 */

//dependencies
const data = require("../lib/data");
const { hash } = require("../helpers/utilities");
const { parseJSON } = require("../helpers/utilities");
const { createRandomString } = require("../helpers/utilities");

//module scaffolding
const handler = {};

handler.tokenHandler = (requestedProperties, callback) => {
    const acceptedMethods = ["get", "post", "put", "delete"];
    if (acceptedMethods.indexOf(requestedProperties.method) > -1) {
        handler._token[requestedProperties.method](requestedProperties, callback);
    } else {
        callback(405);
    }
};

handler._token = {};

handler._token.post = (requestedProperties, callback) => {

    const phone = typeof (requestedProperties.body.phone) === 'string'
        && requestedProperties.body.phone.trim().length === 11
        ? requestedProperties.body.phone : false;

    const password = typeof (requestedProperties.body.password) === 'string'
        && requestedProperties.body.password.trim().length > 0
        ? requestedProperties.body.password : false;

    if (phone && password) {
        data.read('users', phone, (err1, userData) => {
            const hashedPassword = hash(password);
            if (hashedPassword === parseJSON(userData).password) {
                const tokenId = createRandomString(20);
                const expires = Date.now() + 60 * 60 * 2000;
                console.log(Date.now())
                const tokenObject = {
                    'phone': phone,
                    'id': tokenId,
                    expires,
                };

                //store the token
                data.create('tokens', tokenId, tokenObject, (err2) => {
                    if (!err2) {
                        callback(200, tokenObject);
                    } else {
                        callback(500, {
                            error: 'There was a problem in the server side!',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'Password is not valid!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'You have a problem in your request!',
        });

    }

};

handler._token.get = (requestedProperties, callback) => {
    //check the id if valid
    const id = typeof (requestedProperties.queryStringObject.id) === 'string'
        && requestedProperties.queryStringObject.id.trim().length === 20
        ? requestedProperties.queryStringObject.id : false;

    if (id) {
        //lookup the token
        data.read('tokens', id, (err, tokenData) => {
            const token = { ...parseJSON(tokenData) };
            if (!err && token) {
                token.thisIs = 'token-from-get';
                callback(200, token);
            } else {
                callback(404, {
                    error: 'Requested token was not found!',
                });
            }
        });
    }
    else {
        callback(404, {
            error: 'Requested token was not found!',
        });
    }
};

handler._token.put = (requestedProperties, callback) => {
    //check the id if valid
    const id = typeof (requestedProperties.body.id) === 'string'
        && requestedProperties.body.id.trim().length === 20
        ? requestedProperties.body.id : false;

    const extend = typeof (requestedProperties.body.extend) === 'boolean'
        && requestedProperties.body.extend === true
        ? true : false;

    if (id && extend) {
        data.read('tokens', id, (err1, tokenData) => {
            const tokenObject = parseJSON(tokenData);
            if (tokenObject.expires > Date.now()) {
                tokenObject.expires = Date.now() + 60 * 60 * 1000;
                //store the updated token
                data.update('tokens', id, tokenObject, (err2) => {
                    if (!err2) {
                        callback(200, {
                            extended: 'Requested token expire date was extended',
                        });
                    } else {
                        callback(500, {
                            error: 'There was a problem in the server side!',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'Token already expired!',
                });
            }
        });
    }
    else {
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }

};

handler._token.delete = (requestedProperties, callback) => {

    //check the id if valid
    const id = typeof (requestedProperties.queryStringObject.id) === 'string'
        && requestedProperties.queryStringObject.id.trim().length === 20
        ? requestedProperties.queryStringObject.id : false;

    if (id) {
        //lookup the token
        data.read('tokens', id, (err1, tokenData) => {
            if (!err1 && tokenData) {
                data.delete('tokens', id, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'Token was successfully deleted!',
                        });
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
        callback(400, {
            error: 'There was a problem in your request!',
        });
    }

};

handler._token.verify = (id, phone, callback) => {
    //lookup the token
    data.read('tokens', id, (err1, tokenData) => {
        if (!err1 && tokenData) {
            if (parseJSON(tokenData).phone === phone && parseJSON(tokenData).expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });

};

module.exports = handler;