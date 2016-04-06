
define(['App', 'marionette', 'Themes/Nav/ItemView'],
    function(App, Marionette, ThemesItemView) {

        return Marionette.CollectionView.extend({
            childView: ThemesItemView,
            tagName: 'ul',
            className: 'nav navbar-nav',
        });

    });