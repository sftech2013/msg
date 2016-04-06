
module.exports = function(grunt) {

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),

    // init de la configuration des tasks
    grunt.initConfig({
        
        bower: {
            install: {
                //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
            }
        },
        
        less: {
            dev: {
                options: {
                    compress: false,
                    outputSourceFiles: true
                },
                files: {
                    // Compil des fichiers less 
                    "./app/static/css/bootstrap.admin.css":"./app/static/assets/less/admin.less",
                    // ne doit plus servir
                    "./app/static/css/bootstrap.live.css":"./app/static/assets/less/live.less",
                }
            },

            theme: {
                options: {
                    compress: false,
                    outputSourceFiles: true
                },
                files: [
                    {
                      expand: true, 
                      // cwd: './app/themes/'+grunt.option('theme')+'/less/', 
                      cwd: './app/themes/<%= grunt.option("theme") %>/less/', 
                      src: ['styles.less'],    
                      dest: './app/themes/<%= grunt.option("theme") %>/static/', 
                      ext: '.css', 
                      extDot: 'first' 
                    },
                ]
            },

            themes: {
                options: {
                    compress: false,
                    outputSourceFiles: true
                },
                // files: [ ]
            },
        },

        cssmin: {
            minify: {
                files: {
                    'app/static/css/bootstrap.admin.min.css': ['app/static/css/bootstrap.admin.css'],
                    'app/static/css/bootstrap.live.min.css': ['app/static/css/bootstrap.live.css'],
                }
            },

            theme: {
                src: ['./app/themes/<%= grunt.option("theme") %>/static/styles.css'],
                dest: './app/themes/<%= grunt.option("theme") %>/static/styles.min.css'
            },

            themes: {
                files: []
            }
        },

        uglify: {
            vendor: {
                expand: true,
                cwd: 'lib/', 
                src: '**/**.js',
                dest: 'app/static/js/vendor/', 
                ext: '.min.js', // Additionally replace the extension of the destination with `.min.js`
                extDot: 'last', // 'first' par defaut provoque: backbone.marionette.js --> backbone.min.js
                flatten: true
            }
        },
        
        webshot: {
            // example
            homepage: {
                options: {
                    // url, file or html
                    siteType: 'url',
                    site: grunt.option('url'),
                    savePath: './app/themes/'+grunt.option('theme')+'/static/img/preview.png',
                    windowSize: {
                        width: grunt.option('width') || 1024,
                        height: grunt.option('height' || 768)
                    },
                    shotSize: {
                        width: grunt.option('width') || 1024,
                        height: grunt.option('height' || 768)
                        // height: 'all'
                    },
                    renderDelay: 1000
                }
            }
        },

        watch: {
            dev: {
                // files: "app/static/assets/less/**",
                // files: ["app/static/assets/less/**","app/themes/**/less/**"],
                files: ["app/static/assets/less/**"],
                tasks: ["less:dev" ,"cssmin:minify"]
            },
            themes: {
                // pas optimisé du tout ...
                files: ["app/themes/**/less/styles.less"],
                tasks: ["compilethemes"],
                options: {
                  spawn: false
                }
            }
        }
    });

    // Plugins loading
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-webshot');

    // Tasks definition

    grunt.registerTask('bowerinstall', ['bower:install']);
    grunt.registerTask('uglifyvendor', ['uglify:vendor']);
    grunt.registerTask('install', ['bowerinstall', 'uglifyvendor']);
    // grunt.registerTask('heroku', ['install']);

    grunt.registerTask('snap', ['webshot']);

    // grunt.registerTask('default', ['less', 'copy:dev', 'cssmin']);
    grunt.registerTask('default', ['less:dev', 'cssmin:minify', 'watch:dev']);

    /*
        Thèmes
    */

    // usage: $ grunt theme --theme=nomtheme
    grunt.registerTask('theme', ['less:theme', 'cssmin:theme']);

    grunt.registerTask('compilethemes', function() {
        /*
        Récupèration de la liste des noms de folder dans app/themes et build les objets 'files' 
        de src/dest et lance les tasks less:themes et cssmin:themes
        */
        var listthemes = grunt.file.expand({filter: "isDirectory", cwd: "./app/themes"}, ["*"]);
        var filesless = [];
        var filescss = [];

        listthemes.forEach(function(themeName){
            filesless.push({
                src: 'app/themes/'+themeName+'/less/styles.less',
                dest: 'app/themes/'+themeName+'/static/styles.css'
            });
            filescss.push({
                src: 'app/themes/'+themeName+'/static/styles.css',
                dest: 'app/themes/'+themeName+'/static/styles.min.css'
            });
        });

        grunt.config('less.themes.files', filesless);
        grunt.config('cssmin.themes.files', filescss);
        grunt.task.run('less:themes');
        grunt.task.run('cssmin:themes');
    });

};
