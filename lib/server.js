/**
 * Title: Server Library
 * Description: Server Related file
 * Author: Mahin Rahman
 */

//Dependencies
const http = require("http");

const { handleReqRes } = require("../helpers/handleReqRes"); // {Way-two}
const environment = require("../helpers/environments");


//server object - module scaffolding
const server = {};

//Create server
server.createServer = () => {
    const createServerVar = http.createServer(server.handleReqRes);
    // server.listen(server.config.port, () => {
    createServerVar.listen(environment.port, () => {

        console.log(`Environment variable is ${process.env.NODE_ENV}`);
        // console.log(`Environment variable is ${process.env.environmentName}`);
        console.log(`Listening on port ${environment.port}`);

    });
}

//Handle request and response
server.handleReqRes = handleReqRes;

//Start the server
server.init = () => {
    server.createServer();
}

module.exports = server; 
