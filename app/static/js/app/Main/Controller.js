define(['App', 'backbone', 'marionette', 
    'collections/RaceCollection', 
    'Devices/collection', 
    'Main/Layout', 'ColMenu/Layout', 'ColMenu/RaceCollectionView' ],
    function (App, Backbone, Marionette, 
        RaceCollection, 
        DCollection, MainLayout, ColMenuLayout, RaceCollectionView) {

    return Marionette.Controller.extend({

        initialize: function(options){
            // stockage de la région Main pour le MainLayout
            // MainLayout a 2 régions (ColMenu et DashMain) mais ne gère le contenu que du DashController pour DashMain
            // c'est AdminController qui gère directement les autres actions
            this.mainRegion = options.mainRegion;
            this.layout = this._getLayout(options);
            this.mainRegion.show(this.layout);
        },

        show: function(options){
            // init des filters actifs 
            this.filter = options.filter || this.filter;
            this.filter_values = options.filter_values || this.filter_values;

            // Si ce n'est pas 'dash', on laisse couler, seul le menu est chargé
            if(options.action == "dash"){
                this._addDashContent(this.layout.DashMain, options);
            }
        },

        // construction du layout et setup des listeners d'event sur le layout
        _getLayout: function(options){
            var layout = new MainLayout();

            this.listenTo(layout, "render", function(){
                this._showMenuAndContent(layout, options);
            }, this);

            // permet de passer le layout
            this.listenTo(App.vent, "races:sorted", function(){
                var params = _.extend(options, {filter: this.filter, filter_values: this.filter_values});
                this._addDashContent(layout.DashMain, params);
            }, this);

            return layout;
        },

        _showMenuAndContent: function(layout, options){
            // this.raceCol = new RaceCollection(options.races);
            this.raceCol = options.races;
            this._addMenu(layout.ColMenu, options);
            if(options.action == "dash"){
                this._addDashContent(layout.DashMain, options);
            }
        },

        // Injection de la raceCol et injection du ColMenu dans la région spécifiée
        _addMenu: function(region, options){
            // @todo: plus aucune raison pour que les devices soient gérés ici
            var devices = new DCollection();
            devices.deferred = devices.fetch();
            var that = this;
            devices.deferred.done(function(){
                // init du compteur de devices en attente dans le header :
                var waiter = new DCollection( devices.where({room: 'waiting'}) );
                App.vent.trigger("device:waiting:init", waiter);
            });
            
            var racecolview = new RaceCollectionView({ collection: that.raceCol, filter: options.filter, filter_values: options.filter_values });
            var menuLayout = new ColMenuLayout();
            region.show(menuLayout);
            menuLayout.RacesList.show(racecolview);
        },

        _addDashContent: function(region, options){
            var that = this;
            require(['Dash/Controller'],
                function(DashController){
                    var controller = new DashController({
                        DashMainRegion: region
                    });
                    controller.show({action: 'dash', filter: options.filter, filter_values: options.filter_values, raceCol: that.raceCol});

                });

        },

    });
});