module.exports = function (config) {

    config.set({

        basePath: '../',
        frameworks: [ 'jasmine' ],

        files: [ /* specified in gruntfile */ ],

        reporters: [ 'dots' ],
        autoWatch: false,

        port: 9876,
        colors: true,

        logLevel: config.LOG_INFO,

        /*
        browsers: [ 'Chrome' ],
        singleRun: false
        /*/
        browsers: [ 'PhantomJS', 'Chrome' ],
        singleRun: true
        //*/
    });
};