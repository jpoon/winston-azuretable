module.exports = function(grunt) {
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /* grunt-contrib-jshint */
        jshint: {
            files: ['lib/*.js', 'test/*.js']
        },

        /* grunt-simple-mocha */
        simplemocha: {
            options: {
                globals: ['should'],
                timeout: 1000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'spec'
            },

            all: { src: ['test/**/*.js'] }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');

    grunt.registerTask('test', ['simplemocha']);
};
