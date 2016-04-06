define([ 'App', 'backbone', 'marionette', 'underscore', 'text!Themes/List/description.html'],
    function (App, Backbone, Marionette, _, tplDesc) {

        return Marionette.ItemView.extend({
            template: _.template(tplDesc),
            // className: "alert alert-default",
            ui: {
            	formCreate: "form#formCreateTheme"
            },

            events: {
            	"submit @ui.formCreate": "submitTheme"
            },

            submitTheme: function(event){
            	// on ne se sert pas du model, le manque d'identifier' est requis pour la créa de thème
            	// s'assurer que l'idAttribute n'est pas transmis au save avant
            	var data = Backbone.Syphon.serialize(this);
            	var that = this;
            // 	$.post('/themes/', data, 
            // 		function(resp){
            // 			that.trigger("theme:create");
            // 		}
            // 	, 'json');
            // }

            	$.post('/themes/', data)
            		.done(function(resp){
            			console.log("retour theme");
						that.trigger("theme:create");
					});

			}

        });
    });