define(['App', 'Main/Module', 'backbone', 'marionette', 'models/Race', 'Header/NavCollection',
    'views/RaceFormLayout', 'Themes/dropdown/CompositeView', 
    'Header/Layout', 'Header/AppTitleView', 'Header/NavCollectionView', 'models/Stream'],
    function (App, Main, Backbone, Marionette, Race, NavCollection, 
        RaceFormLayout, ddThemesCompositeView,
        HeaderLayout, AppTitleView, NavCollectionView, Stream) {

    return Backbone.Marionette.Controller.extend({

        initialize:function (options) {
            console.log("initialize de l'AdminController");

            App.headerRegion.show(new HeaderLayout({ model: new Stream(this.options.stream_status) }));
            var adminNav = new NavCollection(App.navigation);
            // if(options.is_admin){
            this.is_designer = false;
            if(options.designer){
                this.is_designer = true;
                adminNav.add({name: 'themes', label: 'Thèmes', url: '#themes/list'}, {at: 2});
            }
            App.headerRegion.currentView.Nav.show( new NavCollectionView({collection: adminNav}) );

            var appttview = new AppTitleView({model: App.Prefs.Generales});
            App.headerRegion.currentView.AppTitle.show(appttview);

            this.races = options.races;
            // le module Main charge le MainLayout, build la raceCollection et l'injecte dans le colMenu et dans le DashBoard si besoin
            Main.start({races: this.races, filter: options.filter, filter_values: options.filter_values});
        },

        index:function () {
            this.filter(this.options.filter, this.options.filter_values);
        },

        filter:function(filter,filter_values) {
            // console.log("join du Dash");
            App.socket.emit('join', 'dash');
            App.vent.trigger('menu:navigate:dashboard');

            Main.controller.show({action: 'dash', filter: filter, filter_values: filter_values, races: this.races});

        },

        edit: function(id){
            // Maintenant que le join('dash') est partout, on peut ptet le passer dans le init ?
            App.socket.emit('join', 'dash');
            App.vent.trigger('menu:navigate:dashboard');
            var toedit = new Race({_id: id});
            toedit.deferred = toedit.fetch();
            toedit.deferred.done(function() {
                var rfw = new RaceFormLayout({ model: toedit });
                App.mainRegion.currentView.DashMain.show( rfw );

                var ddListThemesView = new ddThemesCompositeView({ 
                    model: toedit, 
                    collection: App.Themes.Collec,
                    is_designer: this.is_designer
                });
                rfw.themeList.show( ddListThemesView );
            });
        },

        create: function(){
            // Maintenant que le join('dash') est partout, on peut ptet le passer dans le init ?
            App.socket.emit('join', 'dash');
            App.vent.trigger('menu:navigate:dashboard');
            var tocreate = new Race({});
            var rfw = new RaceFormLayout({ model: tocreate });
            App.mainRegion.currentView.DashMain.show( rfw );
            
            var ddListThemesView = new ddThemesCompositeView({ 
                model: tocreate, 
                collection: App.Themes.Collec,
                is_designer: this.is_designer
            });
            rfw.themeList.show( ddListThemesView );
        },

        devices: function(){
            // Main.controller.show({});
            var opt = this.options;
            require(['Devices/collection', 'Devices/compositeView', 'collections/RaceCollection'],
                function(DevicesCollection, DevicesCompositeView, RaceCollection){

                    console.log("join dash, anciennement admin_devices, activation menu");
                    // App.socket.emit('join', 'admin_devices');
                    App.socket.emit('join', 'dash');
                    App.vent.trigger('menu:navigate:devices');

                    var collection = new DevicesCollection();
                    collection.fetch();

                    // prefetch des Races pour alimenter tous les dropdowns de la liste des devices
                    var RaceCollec = new RaceCollection();
                    RaceCollec.deferred = RaceCollec.fetch();

                    RaceCollec.deferred.done(function(){
                        // on passe la collec de devices et la collec de races à la vue + info serveur (host,port)
                        var devList = new DevicesCompositeView({collection: collection, racecollec: RaceCollec, server_info: opt.server_info});

                        App.mainRegion.currentView.DashMain.show( devList );
                    });
                });
        },

        themes: function(action,ident){
            App.socket.emit('join', 'dash');
            App.vent.trigger('menu:navigate:themes');

            require(['Themes/Controller'],
                function(ThemesController){

                    var prefCtrl = new ThemesController({
                        mainRegion: App.mainRegion.currentView.DashMain,
                        action: action,
                        ident: ident,
                    });
                    prefCtrl.show();
                });
        },

        preferences: function(category){
            console.log("join dash -ancien admin_preferences-, activation menu");
            // App.socket.emit('join', 'admin_preferences');
            App.socket.emit('join', 'dash');
            App.vent.trigger('menu:navigate:preferences');

            require(['Prefs/Controller'],
                function(PrefController){

                    var prefCtrl = new PrefController({
                        mainRegion: App.mainRegion.currentView.DashMain,
                        category: category
                    });
                    prefCtrl.show();
                });
        }

    });
});