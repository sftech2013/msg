define(["jquery", "backbone"],
    function ($, Backbone) {
        // Creates a new Backbone Model class object
        var Stream = Backbone.Model.extend({

            // idAttribute: "_id",

            initialize:function () {
                // @todo: resource disponible... gros taf...
            },

            defaults:{
                status: '',
                msg: 'waiting',
                hashtag: '#'
            }

        });

        return Stream;
    }
);