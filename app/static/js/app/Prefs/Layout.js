
define( [ 'App', 'marionette', 'underscore', 'text!Prefs/prefs.html'],

    function( App, Marionette, _, tplPrefs) {

        return Marionette.LayoutView.extend( {
            
            template: _.template(tplPrefs),
            // className: 'section',
            
            regions: {
                PrefsMenu: "#PrefsMenu",
                PrefsContent: "#PrefsContent"
            },

        });
    });