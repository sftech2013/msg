define( [ 'Wall', 'marionette', 'underscore', 'moment', 'models/Item', 'text!Wall/Feed/msg.html'],
    function( App, Marionette, _, moment, Item, itemTemplate) {

        return Marionette.ItemView.extend( {

            template: _.template(itemTemplate),
            tagName: "li",
            className: "list-group-item media",
            model: Item,

            ui: {
                avatar: ".avatar img"
            },

            initialize: function(options){
                // passé depuis le WallController, injecté avec ChildViewOptions de la collection
                // pas l'impression que cela serve encore
                this.model.set('current_race_id', options.current_race_id);
                this.model.set('ctime_str', moment(this.model.get('ctime')).format('HH:mm:ss'));

                // l'API ne retourne pas les numéros de téléphone des SMS si le client
                // n'est pas authentifié. On force pour le cas d'ouverture d'un wall public 
                // depuis une machine authentifiée
                if(this.model.get('provider') == "SMS")
                    this.model.set('author', 'SMS');
            },

            modelEvents: {
                "change:visible": "toggleVisibility"
            },
            
            onRender: function(){
                (!this.model.get('visible')) 
                    ? this.$el.addClass('inactive') 
                    : this.$el.removeClass('inactive');

                // avatar 404 si problème au chargement de l'avatar
                $(this.ui.avatar).error(function(){
                    // @todo valeur en dur, et avatar moche en plus :/
                    $(this).attr('src', '/static/img/avatar_default_404.png');
                });
            },
            
            toggleVisibility: function(){
                var newvis = (this.model.get('visible')) 
                    ? this.$el.slideDown('fast') 
                    : this.$el.slideUp('fast');
            }

        });
    });