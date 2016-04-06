
define( [ 'App', 'marionette', 'moment', 'text!Modal/container-admin.html', 'Modal/model', 'text!Modal/body-item.html'],
    function( App, Marionette, moment, template, ModalModel, bodyModalTemplate) {

        var BodyModalView = Marionette.ItemView.extend({

            model: ModalModel,
            template: _.template(bodyModalTemplate),
            className: "media",

            ui: {
                Preselect: "#preselect",
                Richy: "#preselect .richmedia"
            },

            // appel en cascade depuis le layout. Mime le cpt de WallView
            _onFinishRender: function(){
                this.model.set('ctime_str', moment(this.model.get('ctime')).format('HH:mm:ss'));
                var pre = this.model.get('preselec');
                if(pre && pre.type == 'link'){
                    var links = this.model.get('links');
                    // @todo: pre.type, à renommer en pre.source_field' ? ici on parle du 'type' original en bdd (medias ou links de twitter),
                    // pas du type de medias retourné par embedly -> qu'il faudra ptet traiter autrement que dans les templates ?

                    // FIXME 
                    // revoir ce traitement des links nested de manière pas très claire (array vs collec)
                    var embeded = links[ pre.index ]['embedly'] || links[ pre.index ].get('embedly');
                    // var embeded = links[ pre.index ]['embedly'];

                    if(embeded.type == 'video'){
                        var original_size = {width: embeded.width, height: embeded.height};
                        var dest_width = this.ui.Preselect.innerWidth();

                        var render_size = this.resizePreselect(original_size, dest_width);

                        $(".row > iframe", this.ui.Preselect).width(render_size.width);
                        $(".row > iframe", this.ui.Preselect).height(render_size.height);
                    }

                    if(embeded.type == 'rich'){
                        console.log("injection du richmedia");
                        $(this.ui.Richy).html(embeded.html);
                    }
                }

                $('a', this.$el).attr('target', '_blank');
            },
            resizePreselect: function(origin,dest_width){
                var ow = origin.width, oh = origin.height, w = dest_width;
                var r = (ow/oh);
                var h = (r>=1) ? w/r : ow*r;
                return {width: w, height: Math.round(h)};
            },
        });

        return Marionette.LayoutView.extend( {
            
            id: "modal",
            className: "modal fade",
            template: _.template(template),

            regions: {
                "modalBody": ".modal-body",
            },

            ui: {
                Bubbler: ".bubbler",
                optBubble: ".optionsbubble"
            },

            events: {
                "click .bubble-open": "openBubble",
                "click .bubble-destroy": "destroyBubble",
                "click @ui.optBubble": "toggleOptionTweet"
            },

            initialize: function(options){
                // le model passé en options est un clone de l'item de la collection auquel 
                // on ajoute les prefs Modale et sera rendu dans le BodyModalView
                this.model.set({'prefs': options.prefs, 'preselec': options.preselec});

                // settings: injection + reqres (éviter couplage de Modal avec App)
                // gardez en tête :
                // settings : default_width concerne la taille de la modale admin (que l'on fixe ici, débile)
                // options.prefs : concernera les modales dans les clients (mal foutu aussi, +/- en dur dans le constructor, voir ItemView)

                // setting de la taille de la modale admin: default, small, large (config)
                var settings_modal = App.request('getPref', 'modal');
                this.model.set('default_width', settings_modal.default); 
                this.modalContent = new ModalModel(this.model.toJSON());
            },

            onRender: function(){
                this.modalBody.show(new BodyModalView({model: this.modalContent }));

            },

            _onFinishRender: function(){
                this.modalBody.currentView._onFinishRender();
            },

            toggleOptionTweet: function(){
                // sur une checkbox, attr() retourne l'état initial de l'attribut 'checked'.
                // passage à prop() qui lui change en fonction de l'état
                // comportement pas nouveau, pourtant ca tournait avant ...
                if(this.ui.optBubble.prop('checked')){
                    // les prefs sont un model backbone nested 
                    // malgré ca, pas moyen d'enchainer un get('prefs').set('text', false) ...
                    // du coup on perd les bénéfices des models BB (validation, event, ...)
                    this.model.get('prefs').text = false;
                }else{
                    this.model.get('prefs').text = true;
                }
            },

            openBubble: function(){
                this.toggleOptionTweet();
                // App.vent.trigger("bubble:send:open", this.model);
                console.log("Openbubble pour: %o - %s", this.model.get('race_id'), this.model.get('prefs').size, this.model.get('prefs').text);
                App.socket.emit("bubble_send_open",this.model);
                
                $(this.ui.Bubbler).removeClass('bubble-open').addClass('bubble-destroy');
                $(this.ui.Bubbler).removeClass('btn-warning').addClass('btn-danger');
                $(this.ui.Bubbler).text("Fermer la bulle");
            },

            destroyBubble: function(){
                // App.vent.trigger("bubble:send:destroy", this.model);
                console.log("destroybubble pour: %o", this.model.get('race_id'));
                App.socket.emit("bubble_send_destroy",this.model.get('race_id'));

                $(this.ui.Bubbler).removeClass('bubble-destroy').addClass('bubble-open');
                $(this.ui.Bubbler).removeClass('btn-danger').addClass('btn-warning');
                $(this.ui.Bubbler).text("Ouvrir une bulle");
            }

        });
    });