/**
 * Title: Environments
 * Description: Handle all environments
 * Author: Mahin
*/

//dependencies

//module scaffolding
const environments = {};

environments.staging = {
    port: 3000,
    envName: "staging",
    secretKey: 'stscrtkey',
    maxChecks: 5,
    twilio: {
        fromPhone: 'your Twilio phone number',
        accountSid: 'your accountSid',
        authToken: 'your authToken',
    },

};

environments.production = {
    port: 5000,
    envName: "production",
    secretKey: 'prodscrtkey',
    maxChecks: 5,
    twilio: {
        fromPhone: 'your Twilio phone number',
        accountSid: 'your accountSid',
        authToken: 'your authToken',
    },
};

//determine which environment was passed
const currentEnvironment = typeof (process.env.NODE_ENV) === "string" ? process.env.NODE_ENV : "staging";

//export corresponding environment object
const environmentToExport = typeof (environments[currentEnvironment]) === "object" ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;