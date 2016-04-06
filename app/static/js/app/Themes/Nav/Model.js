
define(['App', 'backbone', 'marionette', 'underscore'],
    function(App, Backbone, Marionette, _) {

        return Backbone.Model.extend({ 
            
            idAttribute: "id",

            initialize: function(){
            	// INFO attention, on parle ici des différentes sections de la rubrique en cours
                // On parle de l'UI, de la navigation, du contenant, pas du contenu
                var choisissable = new Backbone.Chooser(this);
                _.extend(this, choisissable);
            }
        });
    });

