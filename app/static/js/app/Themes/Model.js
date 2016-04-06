define(["jquery", "backbone"],
    function ($, Backbone) {

        var Theme = Backbone.Model.extend({

            idAttribute: "identifier",
            urlRoot: "/theme",
            defaults:{
                "identifier": "<identifiant>", 
                "name": "<nom>", 
                "author": "<auteur>",
            }

        });

        return Theme;
    }
);