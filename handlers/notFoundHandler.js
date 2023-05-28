/**
 * Title: Not Found Handler
 * Description: 404 not found Handler
 * Author: Mahin
 */

//dependencies

//module scaffolding
const handler = {};

handler.notFoundHandler = (requestedProperties, callback) => {
    console.log("Route not found!");
    callback(404, 515, {
        message: "Your requested url was not found!",
    });
};

module.exports = handler;