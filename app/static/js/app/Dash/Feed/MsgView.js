define( [ 'App', 'jquery', 'marionette', 'underscore', 'moment', 'models/Embed', 'models/Item', 'Prefs/Dumbers/Model', 
            'Modal/AdminLayout', 'text!Dash/Feed/msg.html'],
    function( App, $, Marionette, _, moment, Embed, Item, DumberModel, AdminLayout, itemTemplate) {

        return Marionette.ItemView.extend( {
        // return Marionette.LayoutView.extend( {

            template: _.template(itemTemplate),
            tagName: "li",
            className: "list-group-item media item-msg",
            model: Item,

            ui: {
                btnVisible: ".visible",
                btnBubble: ".bubble",
                avatar: ".avatar img",
                messageBody: ".message-body"
            },

            initialize: function(options){
                // FIXME 
                // @todo: refactorer les messages ... ici on en vient à singer du PATCH, 
                // avec un champs '_modified_field' alors qu'on fait un PUT de l'objet complet
                // De plus les resources envoyés ne sont pas cohérentes avec les models attendus.
                // par ex ici on se bagarre avec les avatrs non défini clairement pour les SMS ...
                // Ajouter à ca les types de messages différents (twitter, sms, et ceux à venir !!!!)
                // et c'est devenu du grand n'importe quoi
                this.bubbleTime;
            },

            onBeforeRender: function(){
                this.model.set('ctime_str', moment(this.model.get('ctime')).format('ddd DD/MM HH:mm:ss'));
                // toujours d'actualité, les fields de la resource sont pas fait pour les chiens pourtant
                if(this.model.get('provider') == 'SMS'){
                    if(typeof(this.model.get('avatar')) == "undefined" || _.isNull(this.model.get('avatar'))){
                        this.model.set('avatar', '/static/img/avatar_default_sms.png');
                    }
                }
            },

            // @todo: rendu deux foix ...
            onRender: function(){
                $("a", this.ui.messageBody).attr('target', '_blank');

                if(!this.model.get('visible')) {
                    this.$el.addClass('inactive');
                }else{
                    this.$el.removeClass('inactive');
                }

                $(this.ui.avatar).error(function(){
                    // @todo valeur en dur
                    $(this).attr('src', '/static/img/avatar_default_404.png');
                });
            },

            // View Event Handlers
            events: {
                "click .visible": "toggleVisibility",
                "click .stared": "toggleStar",
                "click .bubble": "openBubble",
                "click .bubble-destroy": "destroyBubble",
                "click .links": "embedlyfy",

                "click .banner": "banUser",

                "click .med": "openModalMedia",
                "click .emb": "openModalEmbed"
            },

            modelEvents: {
                "change:visible": "render",
                "change:stared": "render"
            },

            _openModal: function(type,index){
                var adminLayout = new AdminLayout({
                    model: this.model.clone(), 
                    prefs: App.modalRegion.prefs.large,                 // small ou large. pas super
                    preselec: {type: type, index: index}
                });
                App.modalRegion.show(adminLayout);
            },

            embedlyfy: function(event){
                // FIXME Links Array vs Collec
                // @todo: blinder un peu plus pour tester si embedly est configuré
                // embedly: la key est setté dans les prefs
                if(!_.isUndefined($.embedly.defaults.key)){
                    event.preventDefault();
                    var target = event.currentTarget;
                    $(target).removeClass('btn-default').addClass('btn-danger');
                    $('span', $(target)).removeClass().html('<img src="/static/img/ajax-loader.gif" style="width: 13px; height: auto; margin-top: -5px" />');
                    var tidx = $(target).attr('data-lindex');
                    var links = this.model.get('links');

                    if(!_.isNull(links) && links[tidx]){
                        // @verif: tout ce traitement devrait pê être dans le model ?
                        // embedly sub-module de Modal ?
                        var l = new Embed();
                        var deferred = l.makeDefer({
                            // et encore un petit arrangement Array / Collec bien pénible ...
                            'expanded_url': links[tidx]['expanded_url'] || links[tidx].get('expanded_url')
                        });

                        var that = this;
                        deferred.done(function(obj){
                            var linkTarget = that.model.get('links');
                            var lt = linkTarget[tidx];
                            // coll / Array
                            // tester mais à priori, c'est le typeof de linkTarget qui devrait etre testé, pas lt ...
                            // linkTarget qui n'est autre que links ...
                            if(typeof(lt) == Backbone.Collection) {
                                lt.set('embedly', obj[0]);
                            }else{
                                lt['embedly'] = obj[0];
                            }
                            that.model.save(); 
                            that.render();
                            that._openModal('link', tidx);
                        }).fail(function(obj){
                            console.log("Fail du deferred embedly", obj);
                        });
                    }
                }else{
                    console.log("Vous n'avez pas configuré de compte Embed.ly");
                }

            },

            openModalEmbed: function(event){
                var tidx = $(event.currentTarget).attr('data-lindex');
                this._openModal('link', tidx);
            },

            openModalMedia: function(event){
                var tidx = $(event.currentTarget).attr('data-lindex');
                this._openModal('media', tidx);
            },

            toggleVisibility: function(){
                var newvis = (this.model.get('visible')) ? 0 : 1;
                this.model.save({'_modified_field': 'visible', 'visible': newvis});
            },

            toggleStar: function(){
                var newStar = (this.model.get('stared')) ? 0 : 1;
                this.model.save({'_modified_field': 'stared', 'stared': newStar});
            },

            openBubble: function(){
                if(typeof this.bubbleTime == "number") {
                    window.clearTimeout(this.bubbleTime);
                    this.destroyBubble();
                }

                // FIXME
                // n'a pas l'air de planter, mais se méfier: les objets et array nested dans des clones sont copiés
                // par référence, pas dupliqué.
                var cloned_model = this.model.clone();
                cloned_model.set({prefs: App.modalRegion.prefs.small, preselec: {type: '', index: ''}});

                // App.vent.trigger("bubble:send:open", cloned_model);
                console.log("Openbubble pour: %o - %s", cloned_model.get('race_id'), cloned_model.get('prefs').size);
                App.socket.emit("bubble_send_open", cloned_model);
                this.trigger('bubble:open');

                this.ui.btnBubble.removeClass('btn-default').addClass('btn-warning');
                this.ui.btnBubble.removeClass('bubble').addClass('bubble-destroy');

                // var bubble_timeout = App.request('bubbleTimeout');
                var bubble_timeout = App.request('getPref','bubble_timeout');
                if(bubble_timeout > 0){
                    var duree = bubble_timeout * 1000;
                    var that = this;
                    bubbleTime = setTimeout(function(){
                        that.destroyBubble();
                    }, duree );
                }
            },

            destroyBubble: function(){
                // App.vent.trigger("bubble:send:destroy", this.model);
                console.log("destroybubble pour: %o", this.model.get('race_id'));
                App.socket.emit("bubble_send_destroy", this.model.get('race_id'));
                this.ui.btnBubble.removeClass('btn-warning').addClass('btn-default');
                this.ui.btnBubble.removeClass('bubble-destroy').addClass('bubble');
                this.ui.btnBubble.blur();
            },

            banUser: function(){
                console.log(this.model.get('provider_user_id'));
                var dumber = new DumberModel({provider: this.model.get('provider'), provider_user_id: this.model.get('provider_user_id')});
                dumber.deferred = dumber.save();

                var that = this;
                dumber.deferred.done(function(){
                    if( that.model.get('provider') == "TWITTER"){
                        // redémarrage du stream requis
                        App.vent.trigger("stream:restart:required", {action: "Dumber added demand"});
                    }
                });
            }

        });
    });