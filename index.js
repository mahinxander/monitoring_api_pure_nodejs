/**
 * Title: API Project- Uptime Monitoring Application
 * Description: RESTful API for a uptime monitoring application
 * Author: Mahin Rahman
 * Date: 03/05/2023
 */

const server = require("./lib/server");
const workers = require("./lib/workers");

//Declare the app
const app = {};

//Initialization function
app.init = () => {
    //Start the server
    server.init();

    //Start the workers
    workers.init();

}

//Execute the init function
app.init();

//Export the app
module.exports = app;
