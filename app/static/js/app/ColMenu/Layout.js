
define( [ 'App', 'backbone', 'marionette', 'underscore', 'text!ColMenu/layout.html'],
    function( App, Backbone, Marionette, _, tplColMenu) {

        return Marionette.LayoutView.extend( {
            
            template: _.template(tplColMenu),
            className: "menu-content",

            regions: {
                RacesList: ".races-list",
            },

            initialize: function(){
                // console.log("init ColMenuLayout");
            },

            
        });
    });