/**
 * Title: Handle Request Response
 * Description: Handle Request Response
 * Author: Mahin
 */
//Dependencies
const url = require("url");
const { StringDecoder } = require("string_decoder");
const routes = require("../helpers/routes");
const { notFoundHandler } = require("../handlers/notFoundHandler");
const { parseJSON } = require("../helpers/utilities");


//module scaffolding
const handler = {};

handler.handleReqRes = (req, res) => {
    //Request handle
    //Get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    const queryStringObject = parsedUrl.query;

    //Get the HTTP method
    const method = req.method.toLowerCase();

    //Get the headers as an object
    const headersObject = req.headers;

    //Get the payload, if any
    //decoder object
    const decoder = new StringDecoder('utf-8');
    let realData = '';

    const requestedProperties = {
        parsedUrl,
        path,
        trimmedPath,
        queryStringObject,
        method,
        headersObject,
    };

    const chosenHandler = routes[trimmedPath] ? routes[trimmedPath] : notFoundHandler;

    req.on('data', (buffer) => {
        realData += decoder.write(buffer);
    });
    req.on('end', () => {
        realData += decoder.end();
        requestedProperties.body = parseJSON(realData);

        chosenHandler(requestedProperties, (statusCode, noCode, payload) => {
            statusCode = typeof (statusCode) === 'number' ? statusCode : 500;
            if (noCode && typeof (noCode) !== 'number' && payload !== 'object') { payload = noCode; }
            noCode = typeof (noCode) === 'number' ? noCode : false;
            payload = typeof (payload) === 'object' ? payload : {};
            const payloadString = JSON.stringify(payload);

            //Return the response
            res.setHeader('Content-Type', 'application/json');

            res.writeHead(statusCode);

            if (payloadString !== '{}') { res.write(payloadString); }
            if (noCode) { res.write("\n" + noCode.toString() + "\n"); }
            res.end("\nHello World New");
        });


    });

};

module.exports = handler;

