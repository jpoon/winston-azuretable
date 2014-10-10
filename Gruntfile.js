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
        },

        /* grunt-contrib-watch */
        watch: {
            jshint: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint']
            },
            sass: {
                files: 'public/sass/*.scss',
                tasks: ['sass:dist']
            },
            express: {
                files: ['server/**/*.js', 'server/**/*.jade'],
                tasks: ['express:dev'],
                options: {
                    spawn: false
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', ['simplemocha']);
};
