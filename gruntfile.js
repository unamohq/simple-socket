module.exports = function (grunt) {

    grunt.registerTask('default', [ 'test:dist' ]);

    grunt.registerMultiTask('test', simpleMultiTaskRunner);
    grunt.registerMultiTask('build', simpleMultiTaskRunner);


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        config: {
            src: {
                js: {
                    dir: '.',
                    files: [
                        'index.js',
                        'lib/**/*.js',
                        'test/**/*.js'
                    ],
                    main: 'index.js'
                }
            },
            dist: {
                dir: 'dist',
                bundle: 'dist/<%= pkg.name %>.bundle.js'
            },
            spec: {
                dir: 'test',
                bundle: 'test/<%= pkg.name %>.bundle.js',
                files: 'test/**/*.spec.js'
            }
        },
        clean: {
            dev: [ '<%= config.dist.bundle %>' ],
            test: [ '<%= config.spec.bundle %>' ]
        },
        test: {
            dev: [
                'clean:test',
                'jshint',
                'browserify:test-dev',
                'karma:unit',
                'watch:test',
                'clean:test'
            ],
            dist: [
                'clean:test',
                'jshint',
                'browserify:test-dist',
                'karma:unit',
                'clean:test'
            ]
        },
        build: {
            dist: [
                'clean:test',
                'jshint',
                'browserify:dist',
                'uglify:dist'
            ]
        },
        browserify: {
            options: {
                plugin: [ 'proxyquireify/plugin' ]
            },
            'test-dev': {
                files: [{
                    src: '<%= config.spec.files %>',
                    dest: '<%= config.spec.bundle %>'
                }],
                options: {
                    browserifyOptions: {
                        debug: true
                    }
                }
            },
            'test-dist': {
                files: [{
                    src: '<%= config.spec.files %>',
                    dest: '<%= config.spec.bundle %>'
                }]
            },
            'dist': {
                options: {
                    plugin: [ ], // no proxyquire
                    browserifyOptions: {
                        standalone: 'SimpleSocket'
                    }
                },
                files: [{
                    src: '<%= config.src.js.main %>',
                    dest: '<%= config.dist.bundle %>'
                }]
            }
        },
        watch: {
            test: {
                files: [
                    '<%= config.src.js.files %>',
                    '<%= config.spec.files %>'
                ],
                tasks: [
                    'clean:test',
                    'browserify:test-dev',
                    'karma:unit'
                ]
            }
        },
        jshint: {
            files: [
                'gruntfile.js',
                '<%= config.src.js.files %>'
            ]
        },
        uglify: {
            dist: {
                src: '<%= config.dist.bundle %>',
                dest: '<%= config.dist.bundle %>'
            }
        },
        karma: {
            unit: {
                options: {
                    configFile: '<%= config.spec.dir %>/karma.conf.js',
                    files: [
                        '<%= config.spec.dir %>/phantomjs-extensions.js',
                        '<%= config.spec.bundle %>'
                    ]
                }
            }
        },
    });

    require('load-grunt-tasks')(grunt);


    function simpleMultiTaskRunner() {
        grunt.task.run(this.data);
    }

};
