
define(['App', 'backbone', 'marionette', 'underscore'],
    function(App, Backbone, Marionette, _) {

        return Backbone.Model.extend({ 
            
            idAttribute: "id",

            initialize: function(){
                var choisissable = new Backbone.Chooser(this);
                _.extend(this, choisissable);
            }
        });
    });

