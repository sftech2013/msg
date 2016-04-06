define(["jquery", "backbone"],
    function ($, Backbone) {

        var imagefile = Backbone.Model.extend({

            defaults:{
                "path": ""
            }

        });

        return imagefile;
    }
);