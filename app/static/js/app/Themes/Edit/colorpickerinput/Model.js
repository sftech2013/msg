define(["jquery", "backbone"],
    function ($, Backbone) {

        var Theme = Backbone.Model.extend({

            idAttribute: "name",
            // urlRoot: "/theme",
            defaults:{
                "name": "<name>", 
                "lessval": "<lessval>", 
            }

        });

        return Theme;
    }
);