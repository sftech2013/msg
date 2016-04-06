define(["jquery", "backbone"],
    function ($, Backbone) {
        // Creates a new Backbone Model class object
        var Item = Backbone.Model.extend({

            idAttribute: "_id",
            url: function(){
                return '/message/' + this.get('_id');
            },

            initialize:function () {
                if(_.isUndefined(this.get('message_html')) && !_.isUndefined(this.get('message'))){
                    var msg = twttr.txt.htmlEscape(this.get('message'));
                    var urls = this.get('url_entities');
                    var msg_html = twttr.txt.autoLink(msg, { urlEntities : urls });
                    this.set('message_html', msg_html);
                }
                if(this.get('provider') == 'SMS'){
                    this.set({avatar: '/static/img/avatar_default_sms.png'});
                }
            }
        });

        return Item;
    }
);