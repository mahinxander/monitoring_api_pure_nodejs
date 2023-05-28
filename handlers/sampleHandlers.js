/**
 * Title: Sample Handler
 * Description: Sample Handler
 * Author: Mahin
 */

//dependencies

//module scaffolding
const handler = {};

handler.sampleHandler = (requestedProperties, callback) => {
    console.log("Sample Handler Print");
    callback(200, 515, {
        message: "This is a sample url",
    });
};

module.exports = handler;