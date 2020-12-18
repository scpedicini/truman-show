let appSettings = { };

appSettings.DEV_ENV = false;
appSettings.CSE_ID = process.env.CSE_ID;
appSettings.CSE_KEY = process.env.CSE_KEY;

// appSettings.LocalPath = `F:\\Temp\\Images`;

module.exports = appSettings;