/**
 * Title: User Handler
 * Description: User Handler to handle user related routes
 * Author: Mahin
 */

//dependencies
const data = require("../lib/data");
const { hash } = require("../helpers/utilities");
const { parseJSON } = require("../helpers/utilities");
const tokenHandler = require("./tokenHandler");

//module scaffolding
const handler = {};

handler.userHandler = (requestedProperties, callback) => {
    const acceptedMethods = ["get", "post", "put", "delete"];
    console.log(requestedProperties);
    if (acceptedMethods.indexOf(requestedProperties.method) > -1) {
        handler._user[requestedProperties.method](requestedProperties, callback);
    } else {
        callback(405);
    }
};

handler._user = {};

handler._user.get = (requestedProperties, callback) => {
    if (requestedProperties.queryStringObject.list === 'users') { //finds the list of files

        data.list('users', (errorList, users) => {
            listFiles = { ...users };


            if (!errorList && users) {

                callback(200, listFiles);
            } else {
                callback(500, {
                    error: 'There was a problem in server side'
                })
            }
        })
    }
    // console.log(requestedProperties.queryStringObject);
    else {
        const phone = typeof (requestedProperties.queryStringObject.phone) === 'string'
            && requestedProperties.queryStringObject.phone.trim().length === 11
            ? requestedProperties.queryStringObject.phone : false;
        if (phone) {
            //verify token
            const token = typeof (requestedProperties.headersObject.token) === 'string'
                ? requestedProperties.headersObject.token : false;

            tokenHandler._token.verify(token, phone, (tokenId) => {
                if (tokenId) {
                    //lookup the user
                    data.read('users', phone, (err, user) => {
                        const userObject = { ...parseJSON(user) };
                        if (!err && userObject) {

                            callback(200, userObject);
                        } else {
                            callback(404, {
                                error: "Requested user was not found",
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
            callback(404, {
                error: "Requested user was not found",
            });
        }


    };
};

handler._user.post = (requestedProperties, callback) => {

    const firstName = typeof (requestedProperties.body.firstName) === 'string'
        && requestedProperties.body.firstName.trim().length > 0
        ? requestedProperties.body.firstName : false;

    const lastName = typeof (requestedProperties.body.lastName) === 'string'
        && requestedProperties.body.lastName.trim().length > 0
        ? requestedProperties.body.lastName : false;

    const phone = typeof (requestedProperties.body.phone) === 'string'
        && requestedProperties.body.phone.trim().length === 11
        ? requestedProperties.body.phone : false;

    const password = typeof (requestedProperties.body.password) === 'string'
        && requestedProperties.body.password.trim().length > 0
        ? requestedProperties.body.password : false;

    const tosAgreement = typeof (requestedProperties.body.tosAgreement) === 'boolean'
        && requestedProperties.body.tosAgreement
        ? requestedProperties.body.tosAgreement : false;

    console.log(firstName, lastName, phone, password, tosAgreement);

    if (firstName && lastName && phone && password && tosAgreement) {

        //make sure that the user doesn't already exist
        data.read('users', phone, (err1) => {
            if (err1) {

                //hash the password
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    tosAgreement,
                };

                //store the user to db
                data.create('users', phone, userObject, (err2) => {
                    if (!err2) {
                        callback(200, 10, {
                            message: "User was created successfully",
                        });
                    }
                    else {
                        callback(500, {
                            error: "Could not create new user",
                        });
                    }
                });
            }
            else {
                callback(400, {
                    error: "User already exists!",
                });
            }
        }
        );
    }
    else {
        callback(404, {
            message: "User was not created successfully",
        });
    }

};

handler._user.put = (requestedProperties, callback) => {

    const firstName = typeof (requestedProperties.body.firstName) === 'string'
        && requestedProperties.body.firstName.trim().length > 0
        ? requestedProperties.body.firstName : false;

    const lastName = typeof (requestedProperties.body.lastName) === 'string'
        && requestedProperties.body.lastName.trim().length > 0
        ? requestedProperties.body.lastName : false;

    const phone = typeof (requestedProperties.body.phone) === 'string'
        && requestedProperties.body.phone.trim().length === 11
        ? requestedProperties.body.phone : false;

    const password = typeof (requestedProperties.body.password) === 'string'
        && requestedProperties.body.password.trim().length > 0
        ? requestedProperties.body.password : false;

    const tosAgreement = typeof (requestedProperties.body.tosAgreement) === 'boolean'
        && requestedProperties.body.tosAgreement
        ? requestedProperties.body.tosAgreement : false;



    const urlPhone = typeof (requestedProperties.queryStringObject.phone) === 'string'
        && requestedProperties.queryStringObject.phone.trim().length === 11
        ? requestedProperties.queryStringObject.phone : false;

    if (urlPhone) {

        if (firstName || lastName || password) {

            const token = typeof (requestedProperties.headersObject.token) === 'string'
                ? requestedProperties.headersObject.token : false;

            tokenHandler._token.verify(token, phone, (tokenId) => {
                if (tokenId) {
                    //lookup the user
                    data.read('users', urlPhone, (err1, user) => {

                        const userData = { ...parseJSON(user) };
                        if (!err1 && userData) {

                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = hash(password);
                            }

                            //store to db
                            data.update('users', urlPhone, userData, (err2) => {

                                if (!err2) {

                                    if (phone) {
                                        data.rename('users', urlPhone, phone, (err3) => {

                                            if (!err3) {

                                                callback(200, {
                                                    message: "User was updated successfully with rename",
                                                })
                                            }
                                            else {
                                                callback(400, {
                                                    message: "User was not updated with rename",
                                                    error: err3
                                                })
                                            }

                                        });
                                    }
                                }
                                else {

                                    callback(500, {
                                        error: "Could not update the user",
                                    });
                                }
                            });
                        }
                        else {
                            callback(400, {
                                error: "There are some mistake in your query, please check again",
                            });
                        }
                    });
                } else {
                    callback(403, {
                        error: 'Authentication failure!',
                    });
                }
            });
        }
        else {
            callback(400, {
                error: " Missing required fields",
            });
        }
    }
    else {
        callback(400, {
            error: "The specified user does not exist",
        });
    }

};

handler._user.delete = (requestedProperties, callback) => {


    //check the phone number if valid
    const phone = typeof (requestedProperties.queryStringObject.phone) === 'string'
        && requestedProperties.queryStringObject.phone.trim().length === 11
        ? requestedProperties.queryStringObject.phone : false;
    if (phone) {
        const token = typeof (requestedProperties.headersObject.token) === 'string'
            ? requestedProperties.headersObject.token : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {

                //lookup the user
                data.read('users', phone, (err1, user) => {
                    if (!err1 && user) {
                        data.delete('users', phone, (err2) => {
                            if (!err2) {
                                callback(200, {
                                    message: "User was deleted successfully",
                                });
                            }
                            else {
                                callback(500, {
                                    error: "Could not delete the specified user",
                                });
                            }
                        });
                    }
                    else {
                        callback(404, {
                            error: "Requested user was not found",
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication failure!',
                });
            }
        });
    }
    else {
        callback(404, {
            error: "Requested user was not found",
        });
    }
};


module.exports = handler;