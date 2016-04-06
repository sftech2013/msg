define([ 'App', 'backbone', 'marionette', 'underscore', 'text!ColMenu/race.html'],
    function (App, Backbone, Marionette, _, tplRace) {

        var Count = Backbone.Model.extend({});

        var DevicesCounter = Marionette.ItemView.extend({
            // à remettre dans le layout si on ne va pas plus loin avec les devices
            template: _.template('<%= counter %>'),
            model: Count,
            tagName: 'span',
            ui: {
                dMonitor: ".d-monitor"
            },
            onRender: function(){
                // if(this.model.get('counter')){
                //     // this.$el.addClass('active');
                //     $(this.ui.dMonitor).addClass('active');
                // }else{
                //     $(this.ui.dMonitor).removeClass('active');
                // }
            },
            modelEvents: {
                "change": "render"
            }
        });

        return Marionette.LayoutView.extend({
            
            template: _.template(tplRace),
            tagName: "li",
            // @todo: bcp trop dépendant de bootstrap. exploiter mixin less plutot que les class en dur comme 'clearfix'
            // mais comme ceci n'est pas encore passé sous less, forcément ...
            className: "list-group-item racer media clearfix",

            regions: {
                DevicesMonitor: '.d-monitor'
            },

            ui: {
                racerTools: '.racer-tools .btn',
                monitorGroup: '.monitor-group',
                btnAddDash: '.btn-add-dash',
                btnRemoveDash: '.btn-remove-dash',
                startStream: '.start',
                stopStream: '.stop'
            },

            initialize: function(options){
                this.model.set('is_dashed', options.is_filtered);

                // edit: mutualiser cet event avec 'feed:add' ? mais ce sont des rooms socketio !=
                this.listenTo(App.vent, 'race:inc', this.incItemCount);
                this.listenTo(App.vent, 'race:updated:'+this.model.get('_id'), this.updateRace);
                _.bindAll(this, "incItemCount", "drop");

                // plus de listen dans la region concernée, ca fait des conflits entre les views
                this.listenTo(App.vent, "device:wall:join", this.incDevice);
                this.listenTo(App.vent, "device:wall:leave", this.decDevice);

                this.listenTo(App.vent, "dash:race:remove", this.setRaceRemoved);
            },

            onRender: function(){
                // 'devices' etait une collection par le passé, juste un compteur désormais
                // var counter = new Count({ counter: this.model.get('devices').length });
                var counter = new Count({ counter: this.model.get('_devices') });
                var cntDvc = new DevicesCounter({ model: counter });
                this.DevicesMonitor.show(cntDvc);
                if(this.model.get('status') == 'started'){
                    this.$el.addClass('started');
                }
                if(!this.model.get('visible')){
                    this.$el.addClass('locked');
                }else{
                    this.$el.removeClass('locked');
                }
                if(this.model.get('is_dashed')){
                    this.$el.addClass('dashed')
                }else{
                    this.$el.removeClass('dashed');
                }
                    
                    
                // this.$el.addClass(this.model.get('is_dashed') ? 'dashed' : '');
            },

            events: {
                "drop" : "drop",

                "click @ui.startStream": "onClickStart",
                "hover @ui.startStream": "onOut",
                "mouseleave @ui.startStream": "onHover",

                "click @ui.stopStream": "onClickStop",
                "hover @ui.stopStream": "onHover",
                "mouseleave @ui.stopStream": "onOut",

                // "click @ui.racerTools": "hideTooltip",
                "click @ui.btnAddDash": "addRaceToDash",
                "click @ui.btnRemoveDash": "removeRaceToDash",
            },

            modelEvents: {
                // @todo: c'est un peu tout much là qd meme ...
                "change": "render"
                // "change:visible": "render",
            },

            addRaceToDash: function(id){
                App.vent.trigger('dash:race:add', this.model.get('_id') );
                this.model.set('is_dashed', true);
            },

            removeRaceToDash: function(id){
                App.vent.trigger('dash:race:remove', this.model.get('_id') );
            },

            setRaceRemoved: function(id){
                if(id==this.model.get('_id')){
                    this.model.set('is_dashed', false);
                }
            },

            incDevice: function(data){
                if(data.race_id == this.model.get('_id')){
                    // plus très solide depuis qu'il n'y a plus de vrai collec 'devices'...
                    this.model.set('_devices', this.model.get('_devices') + 1);
                    this.DevicesMonitor.currentView.model.set('counter', this.model.get('_devices') );
                }
            },

            decDevice: function(data){
                if(data.race_id == this.model.get('_id')){
                    this.model.set('_devices', this.model.get('_devices') - 1);
                    this.DevicesMonitor.currentView.model.set('counter', this.model.get('_devices') );
                }
            },

            updateRace: function(model){
                // ultra bourrin :/ mais vient de l'API donc ne devrait pas être pbatique
                this.model.set(model.race);
            },

            drop: function(event, index) {
                this.$el.trigger('update-sort', [this.model, index]);
            }, 

            onClickStart: function(){
                this.model.save({status: 'started'}, {patch: true});
                // redémarrage du stream requis
                // @todo: pas de test success, error 
                App.vent.trigger("stream:restart:required", {action: "Race start demand"});
            },
            
            onClickStop: function(){
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



            incItemCount: function(data){
                // Ca va pas, on passe les races au crible pour trouver la bonne
                // c'est le boulot de la collection de faire ca
                if(this.model.get('_id') == data['race_id']){
                    // console.log("Ajout de %s pour %s", this.model.get('_id'), data['race_id']);
                    this.model.set('_count', this.model.get('_count') + 1);
                    this.runEffect();
                }
            },

            runEffect: function() {
                // effet sur la ColRace à réception d'un msg
                var selectedEffect = 'highlight';
                // passage des options par défaut
                var options = {color: '#666'};
                this.$el.effect( selectedEffect, options, 10, this.callback );
            },

            callback: function() {
                setTimeout(function() {
                $( "#effect" ).removeAttr( "style" ).hide().fadeIn();
                }, 1000 );
            }

        });
    });