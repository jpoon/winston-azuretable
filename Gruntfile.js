module.exports = function(grunt) {
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /* grunt-contrib-jshint */
        jshint: {
            files: ['lib/*.js', 'test/*.js'],
            options: {
                esversion: 6
              },
        },

        /* grunt-simple-mocha */
        simplemocha: {
            options: {
                globals: ['should'],
                timeout: 5000,
                ignoreLeaks: false,
                ui: 'bdd',
            },

            all: { src: ['test/**/*.js'] }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');

    grunt.registerTask('test', ['simplemocha']);
    grunt.registerTask('default', ['jshint', 'test']);
};
