
define([ 'App', 'marionette', 'underscore', 'models/Race', 'text!Dash/Feed/manager.html'],
    function (App, Marionette, _, Race, tplFeedTools) {

        return Marionette.ItemView.extend({

        	model: Race,
            template: _.template(tplFeedTools),
            tagName: "form",

            ui: { 
                // comment fait on avec les régions nested (toolAlert > bubbleCloser)
                // en meme temps ca ne lie pas trop les features à la struct. du DOM, c pas plus mal
                // edit: en passant, cet orga est complètement obso ... bien la preuve qu'en nestant des fields
                // on aurait été dans la panade, c bien mieux à plat, sans hiérarchie
                colLeft: '.manager-col-left',
                    startStream: '.start',
                    stopStream: '.stop',
                    inputGroupHashtags: '.input-group-hashtags',
                        searchInput: '.searchInput',
                        searchBtn: '.searchBtn',
                    labelHashtags: '.label-hashtags',
                colRight: '.manager-col-right',
                    toolMenu: '.toolMenu',
                        btnVisible: '.btnVisible',
                        btnStared: '.btnStared',
                        menuRemoveRace: '.remove-race',
                        removeMessages: '.remove-messages',
                    toolAlert: '.toolAlert',
                        bubbleCloser: '.bubbleCloser',
            },

            initialize: function(options){
                // console.log(options);
                this.model.fetch();
                this.listenTo(App.vent, 'race:hashtag', this.setHashtag);
                this.listenTo(App.vent, 'bubble:exec:open', this.displayAlert);
                this.listenTo(App.vent, 'bubble:exec:destroy', this.hideAlert);
                this.listenTo(App.vent, 'race:updated:'+this.model.get('_id'), this.raceUpdated);
            },

            events: {
                "submit": "onTagSubmit",
                // "click @ui.searchBtn": "onTagSubmit",

                "focus @ui.searchInput": "enlargeForm",
                "blur @ui.searchInput": "stretchForm",

                // les start/stop ne sont plus visble dans les managerViews depuis un moment ...
                "click @ui.startStream": "onClickStart",
                "hover @ui.startStream": "onOut",
                "mouseleave @ui.startStream": "onHover",

                "click @ui.stopStream": "onClickStop",
                "hover @ui.stopStream": "onHover",
                "mouseleave @ui.stopStream": "onOut",

                "click @ui.btnStared": "filterStared",
                "click @ui.btnVisible": "toggleVisible",
                "click @ui.menuRemoveRace": "removeRace",
                "click @ui.removeMessages": "removeMessages",

                "click @ui.bubbleCloser": "bubbleDestroy",
            },

            modelEvents: {
                // "change": "render"
                // limite la casse et sera plus facile à optimiser par la suite normalement
                "change:hashtag_str": "render", 
                "change:visible": "render",
                "change:status": "render"
            },

            raceUpdated: function(model){
                // violent ...
                this.model.set(model.race);
            },

            enlargeForm: function(){
                $(this.ui.colRight).fadeOut(100);
                var that = this;
                $(this.ui.colRight).queue(function() {
                    $(that.ui.colLeft).switchClass('col_normal', 'col_large', 100);
                    $(that.ui.searchInput).addClass('active');
                    $(that.ui.searchBtn).css({opacity: 1});
                    // $(that.ui.searchBtn).css({display: 'block'});
                    $(this).dequeue();
                });

                return true;
            },

            stretchForm: function(){
                $(this.ui.searchInput).removeClass('active');
                var that = this;
                $(this.ui.colLeft).switchClass('col_large', 'col_normal', 100);
                $(this.ui.colLeft).queue(function() {
                    $(that.ui.colRight).fadeIn(100);
                    $(that.ui.searchBtn).css({opacity: 0});
                    // $(that.ui.searchBtn).css({display: 'none'});
                    $(this).dequeue();
                });

                // this.ui.searchInput.blur();
                $(window).focus();
                return true;
            },

            onTagSubmit: function(event){
                // Enregistrement d'un nouveau 'step' de hashtags
                event.preventDefault();
                var tag = this.ui.searchInput.val();
                this.model.save({hashtag: tag}, {patch: true});
                // redémarrage du stream requis
                App.vent.trigger("stream:restart:required", {action: "modification hashtag"});
            },

            setHashtag: function(data){
                // @todo: ne doit pas servir
                console.log("les hashtags ont changés:", data['hashtag']);
                this.model.set({'hashtag': data['hashtag']});
            },


            /*
            @info: plus de bouton start/stream dans l'ui, 
            */
            onClickStart: function(){
                // on PATCH le model
                this.model.save({status: 'started'}, {patch: true});
                // redémarrage du stream requis
                // @todo: pas de test success, error 
                App.vent.trigger("stream:restart:required", {action: "Race start demand"});
            },

            onClickStop: function(){
                // on PATCH le model
                this.model.save({status: 'stopped'}, {patch: true});
                // redémarrage du stream requis
                // @todo: pas de test success, error 
                App.vent.trigger("stream:restart:required", {action: "Race stop demand"});
            },


            onHover: function(event){
                var target = event.currentTarget;
                $(target).addClass('btn-danger').removeClass('btn-success');
                $('span', target).addClass('glyphicon-pause').removeClass('glyphicon-play');
            },

            onOut: function(event){
                var target = event.currentTarget;
                $(target).removeClass('btn-danger').addClass('btn-success');
                $('span', target).removeClass('glyphicon-pause').addClass('glyphicon-play');
            },


            filterStared: function(){
                if(this.ui.btnStared.hasClass('active')){
                    App.vent.trigger('feed:filtering:'+this.model.get('_id'), {race_id: this.model.get('_id'), filtering: ''} );
                    this.ui.btnStared.removeClass('active').blur();
                }else{
                    App.vent.trigger('feed:filtering:'+this.model.get('_id'), {race_id: this.model.get('_id'), filtering: '_filter_stared'} );
                    this.ui.btnStared.addClass('active').blur();
                }
            },

            toggleVisible: function(){
                // WIP on passe en PATCH, bcp plus clean
                this.model.save(
                    {visible: (!this.model.get('visible')) ? 1 : 0}, 
                    {patch: true}
                );
            },

            inactiveAllBtn: function(){
                $('li', this.ui.toolMenu).removeClass('active');
            },

            removeRace: function(){
                App.vent.trigger('dash:race:remove', this.model.get('_id'));
            },

            displayAlert: function(data){
                if(data.race_id == this.model.get('_id')){
                    this.ui.toolMenu.hide();
                    this.ui.toolAlert.show();
                }
            },

            hideAlert: function(data){
                if(data == this.model.get('_id')){
                    this.ui.toolMenu.show();
                    this.ui.toolAlert.hide();
                }
            },

            bubbleDestroy: function(){
                // @WIP: peut pas marcher ici ... on passe la Race au socket 
                // alors que c'est le message qui est attendu
                console.log("destroybubble via manager pour: %o", this.model.get('_id'));
                App.socket.emit("bubble_send_destroy",this.model.get('_id'));
            },

            removeMessages: function(){
                if(confirm("Voulez-vous vraiment supprimer tous les messages de ce live ?\n Attention cette action est irréversible")){
                    App.vent.trigger("remove:messages:"+this.model.get('_id'))
                }
            }

        });
    });
