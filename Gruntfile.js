module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // uglify: {
    //   options: {
    //     banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
    //   },
    //   build: {
    //     src: 'src/<%= pkg.name %>.js',
    //     dest: 'build/<%= pkg.name %>.min.js'
    //   }
    // }
    jshint: {
      all: ['Gruntfile.js', 'js/*.js', 'agents/*.js']
    },
    csslint: {
      dev: {
        options: {
          'box-sizing': false,
          'box-model': false,
          'ids': false,
          'important': false,
          'shorthand': false,
          'fallback-colors': false,
          'compatible-vendor-prefixes': false,
          'adjoining-classes': false,
          'import': false
        },
        src: ['mobile/css/mobile.css']
      }
    },
    jsonlint: {
      dev: {
        src: ['./*.json' ]
      }
    },
    watch: {
      files: ['smartboard/**/*.{js,scss}','shared/**/*.{js,scss}','mobile/**/*.{js,scss}','test/**/*.{js,scss}'],
      tasks: ['default'],
      options: { nospawn: true }
    }
  });

  // Load the plugin that provides the "uglify" task.
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-jsonlint');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  // grunt.registerTask('default', ['uglify']);
  grunt.registerTask('default', ['jshint', 'csslint', 'jsonlint']);
  grunt.registerTask('lint', ['jshint', 'csslint', 'jsonlint']);
  grunt.registerTask('compile', ['sass']);

  grunt.registerTask('test', 'run mocha-phantomjs', function () {
    var done = this.async();
    var child_process = require('child_process');

    child_process.exec('mocha-phantomjs ./test/smartboard.html', function (err, stdout) {
      grunt.log.write(stdout);
    });
  });
};