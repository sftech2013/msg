require.config({
    baseUrl:"/static/js/app",
    // 3rd party script alias names (Easier to type "jquery" than "libs/jquery, etc")
    noGlobal: true,
    paths:{
        // Core Libraries
        "jquery":                   "../vendor/jquery.min",
        "jqueryui":                 "../vendor/jquery-ui.min",
        // LoDash remplace Underscore
        // "underscore":               "../vendor/lodash.compat.min",
        "underscore":               "../vendor/lodash.min",
        "backbone":                 "../vendor/backbone.min",
        "marionette":               "../vendor/backbone.marionette.min",
        "bootstrap":                "../vendor/bootstrap.min",
        "socketio":                 "../vendor/socket.io.min",
        "moment":                   "../vendor/moment.min",

        // Plugins
        "backbone.wreqr":           "../vendor/backbone.wreqr.min",
        "backbone.babysitter":      "../vendor/backbone.babysitter.min",
        "moment.fr":                "../vendor/fr.min",
        "backbone.validateAll":     "../vendor/Backbone.validateAll.min",
        "backbone.chooser":         "../vendor/backbone-chooser.min",
        "backbone.syphon":          "../vendor/backbone.syphon.min",
        "embedly":                  "../vendor/jquery.embedly.min",
        "scrollTo":                 "../vendor/jquery.scrollTo.min",
        "text":                     "../vendor/text.min",
        "twitter-text":             "../vendor/twitter-text.min",

        "spectrum":                 "../vendor/spectrum.min",

        // Stand by...
        // "nanoscroller":"../libs/plugins/jquery.nanoscroller.min",
    },
    // Sets the configuration for your third party scripts that are not AMD compatible
    shim:{
        "bootstrap":["jquery"],
        "jqueryui":["jquery"],
        "backbone":{
            "deps":["underscore"],
            // Exports the global window.Backbone object
            "exports":"Backbone"
        },
        "embedly":{ "deps": ["jquery"], "exports": "embedly" },
        "scrollTo":{ "deps": ["jquery"] },
        // "nanoscroller":{ "deps": ["jquery"] },
        "marionette":{
            "deps":["underscore", "backbone", "backbone.wreqr", "backbone.babysitter", "backbone.chooser", 
                    "backbone.syphon", "jquery", "embedly", "scrollTo", "moment.fr", "twitter-text"
                    // "nanoscroller"
                    , "spectrum"
                    ],
            // Exports the global window.Marionette object
            "exports":"Marionette"
        },
        "socketio": {
            "exports":"io"
        },
        "backbone.validateAll":["backbone"],
        "backbone.chooser":["backbone"]
    }
});

// Includes Desktop Specific JavaScript files here (or inside of your Desktop router)
require(["App", "routers/AdminRouter", "controllers/AdminController", "Prefs/Module", "Themes/Module", "jquery", "jqueryui", "bootstrap", "backbone.validateAll"],
    function (App, AppRouter, Controller, Prefs, Themes) {

        App.options = {
            server_info: window.server_info,
            // default_app: window.default_app,
            settings: window.settings,
            races: window.races,
            default_race: window.default_race,
            stream_status: window.stream_status,
            twitter_account: window.twitter_account,
            level: window.level,
            is_admin: window.is_admin,          // @todo: un module User va s'imposer
            designer: window.designer,
            themes: window.themes,
            filter: 'status',
            // filter_values: 'started,stopped'
            filter_values: 'started'
        };

        Prefs.start(App.options.settings);
        Themes.start(App.options.themes);
        
        App.appRouter = new AppRouter({
            controller:new Controller(App.options)
        });
        App.start(App.options);
    });