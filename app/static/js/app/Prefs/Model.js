
define(['App', 'backbone', 'marionette', 'underscore'],
    function(App, Backbone, Marionette, _) {

        return Backbone.Model.extend({ 
            
            idAttribute: "id",

            initialize: function(){
            	// INFO attention, on parle ici des différentes sections de la page Options (générales, bannis, ...)
                // pas des Prefs en tant que tel, mais de leur représentation dans l'UI
                var choisissable = new Backbone.Chooser(this);
                _.extend(this, choisissable);
            }
        });
    });

