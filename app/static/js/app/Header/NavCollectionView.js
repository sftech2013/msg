
define(['App', 'marionette', 'Header/NavItemView'],
    function(App, Marionette, NavItemView) {

        return Marionette.CollectionView.extend({
            childView: NavItemView,
            tagName: 'ul',
            className: 'nav navbar-nav',
        });

    });