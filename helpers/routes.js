/**
 * Title: Routes
 * Description: Application Routes 
 * Author: Mahin
 */

//Dependencies
const { sampleHandler } = require("../handlers/sampleHandlers");
const { userHandler } = require("../handlers/userHandler");
const { tokenHandler } = require("../handlers/tokenHandler");
const { checkHandler } = require("../handlers/checkHandler");

const routes = {
    sample: sampleHandler,
    user: userHandler,
    token: tokenHandler,
    check: checkHandler,
};

module.exports = routes;
