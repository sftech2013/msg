define(['App', 'backbone', 'marionette', 'Prefs/Layout', 'Prefs/CollectionView', 'Prefs/Collection', 
    'Prefs/Dumbers/Layout',
    'Prefs/General/GeneralView', 'Prefs/General/Model'],
    function (App, Backbone, Marionette, PrefLayout, PrefsCollectionView, PrefsCollection, DumbersLayout,
        GeneralView, PrefsModel) {

    return Marionette.Controller.extend({

        initialize: function(options){
            // stockage de la région utilisée pour afficher le composant
            this.mainRegion = options.mainRegion;
            console.log("je suis le controller des Prefs : %o", options.category || "default");
        },

        show: function(){
            var layout = this._getLayout();
            this.mainRegion.show(layout);
        },

        _getLayout: function(){
            var layout = new PrefLayout();

            this.listenTo(layout, "render", function(){
                this._showMenuAndContent(layout);
            }, this);

            return layout;
        },

        _showMenuAndContent: function(layout){
            this._get_menu(layout.PrefsMenu);
            this._get_content(layout.PrefsContent);
        },

        _get_menu: function(region){
            var menu = new PrefsCollectionView({ collection: new PrefsCollection(App.preferences) });
            region.show(menu);
            // pas besoin ici
            return menu;
        },

        _get_content: function(region){
            var category = (this.options.category) ? this.options.category : 'general';
            App.vent.trigger('prefsmenu:navigate:'+category);

            switch(category){
                default:
                case 'general':
                    var prf = new PrefsModel();
                    prf.deferred = prf.fetch();
                    prf.deferred.done(function(){
                        var view = new GeneralView({ model: prf });
                        region.show(view);
                    });
                    break;
                case 'dumbers':
                    var view = new DumbersLayout();
                    this.listenTo(view, "render", function(){
                        view._setRegion();
                    }, this);
                    region.show(view);
                    break;
            }
            // pas besoin ici
            return view;
        }


    });
});