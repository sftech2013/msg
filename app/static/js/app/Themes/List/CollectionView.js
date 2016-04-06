
define(['App', 'marionette', 'Themes/List/ItemView'],
    function(App, Marionette, ThemesListItemView) {

        return Marionette.CollectionView.extend({
            childView: ThemesListItemView,
            tagName: 'ul',
            className: 'list-group media-list',

            initialize: function(){
            	// this.collection.fetch();
            }
        });

    });