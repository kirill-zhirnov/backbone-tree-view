module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean : {
            js : ['lib'],
            css : ['css']
        },

        coffee : {
            join : {
                options: {
                    join: true,
                    bare : true
                },
                files: {
                    'lib/<%= pkg.name %>.js': [
                        'src/preamble.coffee',
                        'src/models/model.coffee',
                        'src/models/collection.coffee',
                        'src/views/view.coffee',
                        'src/views/tree.coffee',
                        'src/views/item.coffee',
                        'src/views/list.coffee',
                        'src/views/placeholder.coffee',
                        'src/models/settings.coffee',
                        'src/plugins/basic.coffee',
                        'src/plugins/dnd.coffee'
                    ]
                }
            }
        },
        concat: {
            options: {
                banner: '(function (root, factory) {\n\n' +
                '  if (typeof define === "function" && define.amd) {\n' +
                '    // AMD (+ global for extensions)\n' +
                '    define(["underscore", "backbone", "backbone-tree-model"], function (_, Backbone) {\n' +
                '      return (root.BackTree = factory(_, Backbone));\n' +
                '    });\n' +
                '  } else if (typeof exports === "object") {\n' +
                '    // CommonJS\n' +
                '    module.exports = factory(require("underscore"), require("backbone"), require("backbone-tree-model"));\n' +
                '  } else {\n' +
                '    // Browser\n' +
                '    root.BackTree = factory(root._, root.Backbone);\n' +
                '  }' +
                '}(this, function (_, Backbone) {\n\n  "use strict";\n\n',
                footer: '  return BackTree;\n' +
                '}));',
                stripBanners: true
            },
            dist: {
                src: ['lib/<%= pkg.name %>.js'],
                dest: 'lib/<%= pkg.name %>.js'
            }
        },
        uglify : {
            dist : {
                src: '<%= concat.dist.dest %>',
                dest: 'lib/<%= pkg.name %>.min.js'
            }
        },
        watch : {
            js : {
                files : 'src/**/*.coffee',
                tasks : ['js']
            },

            css : {
                files : 'less/**/*.less',
                tasks : ['css']
            }
        },
        less : {
            bootstrap : {
                options : {
                    paths: ['node_modules/bootstrap/less']
                },
                files : {
                    'css/bootstrap-theme.css' : 'less/bootstrap-theme.less'
                }
            }
        },
        cssmin : {
            options : {},
            target: {
                files: {
                    'css/bootstrap-theme.min.css': ['css/bootstrap-theme.css']
                }
            }
        }
    });

    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'})

    grunt.registerTask('js', ['clean:js', 'coffee', 'concat', 'uglify']);
    grunt.registerTask('css', ['clean:css', 'less', 'cssmin']);
    grunt.registerTask('default', ['js', 'css']);
};
