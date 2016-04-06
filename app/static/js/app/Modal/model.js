define(["jquery", "backbone", "models/Item"],
    function ($, Backbone, Item) {

        var PrefsModal = Backbone.Model.extend();

        // WARNING
        // Pas clair du tout
        var ModalModel = Item.extend({

        	initialize: function(options){
        		// finalement pas grand intérêt d'avoir un model propre au modal
        		// on ne tire meme pas vraiment bénéfice du model pref nested ...
        		this.set({'prefs': new PrefsModal(options.prefs)});
        	},
            

        });
        return ModalModel;
    }
);