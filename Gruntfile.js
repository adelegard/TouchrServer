var fs = require('fs');

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'test/**/*.js', 'cloud/**/*.js', '!cloud/**/lib_*.js'],
            options: {
                globals: {
                    console: true,
                    module: true,
                    document: true
                }
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.test.js']
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['test']
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', ['jshint', 'mochaTest']);


	/**
	 * NPM postinstall
	 */
	grunt.registerTask('postinstall', 'Tasks that run after `npm install`.', function() {
        grunt.task.run('install-hooks');
    });

	grunt.registerTask('install-hooks', 'Copy local hooks into .git directory.', function () {
        // precommit hook is inside the repo as /hooks/pre-commit
        // copy the hook file to the correct place in the .git directory
        grunt.file.copy('hooks/pre-push', '.git/hooks/pre-push');

        // chmod the file to readable and executable by all
        fs.chmodSync('.git/hooks/pre-push', '755');
    });

    grunt.registerTask('default', ['test']);

};