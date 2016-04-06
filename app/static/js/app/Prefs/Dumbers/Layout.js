
define( [ 'App', 'marionette', 'underscore', 'Prefs/Dumbers/DescView', 'Prefs/Dumbers/Collection', 'Prefs/Dumbers/CollectionView', 'text!Prefs/Dumbers/layout.html'],

    function( App, Marionette, _, DescView, DumbersCollection, DumbersCollectionView, tplLayout) {

        return Marionette.LayoutView.extend( {
            
            template: _.template(tplLayout),
            // className: 'container-fluid',
            // className: '',
            
            regions: {
                DumbersDesc: "#DumbersDesc",
                DumbersContent: "#DumbersContent"
            },

            initialize: function(){
                // this._getDescription(this.DumbersDesc);
            },

            _setRegion: function(){
                this._getDescription(this.DumbersDesc);
                this._getDumbers(this.DumbersContent);
            },

            _getDescription: function(region){
                var descview = new DescView();
                region.show(descview);
                return descview;
            },

            _getDumbers: function(region){
                var dmbCollView = new DumbersCollectionView({collection: new DumbersCollection() });
                region.show(dmbCollView);
                return dmbCollView;
            }

        });
    });