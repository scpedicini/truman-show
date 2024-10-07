let appSettings = { };

appSettings.DEV_ENV = false;
appSettings.CSE_ID = process.env.CSE_ID;
appSettings.CSE_KEY = process.env.CSE_KEY;
appSettings.COLOR_SETTINGS = '#eeeeee';

appSettings.BANNED_DOMAINS = [
    'shutterstock.com',
    'alamy.com',
    'dreamstime.com',
    'vectorstock.com',
    'gettyimages.com',
    'istockphoto.com',
    '123rf.com',
    'pixtastock.com',
    'canstockphoto.com'
];

appSettings.NO_AI = false;
appSettings.BOUNDS = { };

// appSettings.LocalPath = `F:\\Temp\\Images`;

module.exports = appSettings;