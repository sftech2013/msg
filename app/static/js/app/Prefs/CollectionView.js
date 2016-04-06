
define(['App', 'marionette', 'Prefs/ItemView'],
    function(App, Marionette, PrefsItemView) {

        return Marionette.CollectionView.extend({
            childView: PrefsItemView,
            tagName: 'ul',
            className: 'nav navbar-nav',
        });

    });