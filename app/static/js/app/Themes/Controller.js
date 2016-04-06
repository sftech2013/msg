define(['App', 'backbone', 'marionette', 'Themes/Layout', 'Themes/Nav/CollectionView', 'Themes/Nav/Collection', 'Themes/List/Layout',
    'Themes/Edit/FormLayout'
    // 'Themes/List/CollectionView', 'Themes/Collection', 'Themes/List/ItemLayout', 'Themes/Model'
    ],
    function (App, Backbone, Marionette, ThemesLayout, ThemesNavCollectionView, ThemesNavCollection, ThemesListLayout, 
        ThemesFormLayout
        // ThemesListCollectionView, ThemesCollection, ThemesItemLayout, ThemesModel
        ) {

    return Marionette.Controller.extend({

        initialize: function(options){
            // stockage de la région utilisée pour afficher le composant
            this.mainRegion = options.mainRegion;
            console.log("je suis le controller des Themes : %o", options.action || "list");
        },

        show: function(){
            var layout = this._getLayout();
            this.mainRegion.show(layout);
        },

        _getLayout: function(){
            var layout = new ThemesLayout();

            this.listenTo(layout, "render", function(){
                this._showMenuAndContent(layout);
            }, this);

            return layout;
        },

        _showMenuAndContent: function(layout){
            this._get_menu(layout.ThemesMenu);
            this._get_content(layout.ThemesContent);
        },

        _get_menu: function(region){
            var menu = new ThemesNavCollectionView({ collection: new ThemesNavCollection(App.themesnav) });
            region.show(menu);
            // pas besoin ici
            return menu;
        },

        _get_content: function(region){
            var action = (this.options.action) ? this.options.action : 'list';
            App.vent.trigger('themesmenu:navigate:'+action);

            switch(action){
                default:
                case 'list':
                    var view = new ThemesListLayout();
                    this.listenTo(view, "render", function(){
                        view._setRegion();
                    }, this);
                    region.show(view);
                    break;
                    
                case 'edit':
                    // @todo: edit sans ident de thème non traité !
                    // gérer le create ici ? 
                    var th = App.request('getThemeByIdent', this.options.ident);
                    var view = new ThemesFormLayout({model: th });
                    this.listenTo(view, "render", function(){
                        view._setRegions();
                    }, this);
                    region.show(view);
                    break;
            }
            // pas besoin ici
            // return view;
            return
        }


    });
});