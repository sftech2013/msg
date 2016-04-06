
define( [ 'App', 'marionette', 'underscore', 'text!Themes/layout.html'],

    function( App, Marionette, _, tplLayout) {

        return Marionette.LayoutView.extend( {
            
            template: _.template(tplLayout),
            
            regions: {
                ThemesMenu: "#ThemesMenu",
                ThemesContent: "#ThemesContent"
            },

        });
    });