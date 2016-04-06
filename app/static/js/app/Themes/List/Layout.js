
define( [ 'App', 'marionette', 'underscore', 'Themes/List/DescView', 'Themes/Collection', 'Themes/List/CollectionView', 'text!Themes/List/layout.html'],

    function( App, Marionette, _, DescView, ThemesCollection, ThemesListCollectionView, tplLayout) {

        return Marionette.LayoutView.extend( {
            
            template: _.template(tplLayout),
            
            regions: {
                PageDesc: "#PageDesc",
                PageContent: "#PageContent"
            },

            ui: {
                refreshList: ".refresh-list"
            },

            events: {
                "click @ui.refreshList": "refreshList"
            },

            initialize: function(){
                // this._getDescription(this.DumbersDesc);
            },

            _setRegion: function(){
                this._getDesc(this.PageDesc);
                this._getContent(this.PageContent);
            },

            _getDesc: function(region){
                var descview = new DescView();
                region.show(descview);
                this.listenTo(descview, "theme:create", this.refreshList);
                return descview;
            },

            _getContent: function(region){
                var collView = new ThemesListCollectionView({collection: App.Themes.Collec});
                region.show(collView);
                return collView;
            },

            refreshList: function(){
                this.PageContent.currentView.collection.fetch();
            }

        });
    });