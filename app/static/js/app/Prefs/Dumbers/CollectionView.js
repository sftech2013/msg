
define(['App', 'marionette', 'Prefs/Dumbers/ItemView'],
    function(App, Marionette, DumberItemView) {

        return Marionette.CollectionView.extend({
            childView: DumberItemView,
            tagName: 'ul',
            className: 'list-group media-list',

            initialize: function(){
            	this.collection.fetch();
            }
        });

    });