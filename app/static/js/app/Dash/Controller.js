define(['App', 'backbone', 'marionette', 'Dash/Layout', 'Dash/FeedCollectionView', 'Dash/MasterCompositeView' ],
    function (App, Backbone, Marionette, DashLayout, FeedCollectionView, DashMasterCompositeView) {

    return Marionette.Controller.extend({

        initialize: function(options){
            // stockage de la région utilisée pour afficher le composant
            this.DashMainRegion = options.DashMainRegion;
            // this.filter = options.filter;
            // this.filter_values = options.filter_values;
        },

        show: function(options){
            // this.DashMainRegion = options.DashMainRegion || this.DashMainRegion;
            this.filter = options.filter || this.filter;
            this.filter_values = options.filter_values || this.filter_values;

            var layout = this._getLayout(options);
            this.DashMainRegion.show(layout);
            // pas trouvé mieux pour le resize initial
            layout.DashBoard.currentView._calcDashWidth();
            layout.DashBoard.currentView.resizeHandler();
        },

        // construction du layout et set up d'un event 'render' sur le layout
        _getLayout: function(options){
            var layout = new DashLayout();

            this.listenTo(layout, "render", function(){
                this._showMasterAndContent(layout, options.action, options.raceCol);
            }, this);

            // this.listenTo(App.vent, "races:sorted", function(){
            //     // console.log("rerender de la feedcollection");
            //     this._initialContent(layout.DashBoard, options.raceCol);
            // }, this);

            return layout;
        },

        // render du DashMaster et du DashBoard dans le layout
        _showMasterAndContent: function(layout, action, raceCol){

            this._addMaster(layout.DashMaster, raceCol);
            // @todo: nettoyer ref à 'dash' ?
            if(action == 'dash'){
                this._initialContent(layout.DashBoard, raceCol);
            }
        },

        // Ajout du DashMaster à la région spécifiée
        _addMaster: function(region, raceCol){
            var dashmaster = new DashMasterCompositeView({ collection: raceCol });
            region.show(dashmaster);
        },

        // Ajout du contenu initial dans la région spécifiée ( DashBoard )
        _initialContent: function(region, raceCol){
            // passage des args en option dans l'init pour filter la collec
            var optQuery = {'filter': this.filter, 'filter_values': this.filter_values};

            var filtered_coll = raceCol.byFilter(this.filter, this.filter_values);

            // console.log("la coll en cours: %o - %s, %s", filtered_coll, this.filter, this.filter_values);
            var view = new FeedCollectionView({ collection: filtered_coll, optQuery: optQuery });
            region.show(view);
        },


    });
});