define( [ 'App', 'marionette', 'underscore', 'models/Race', 'Dash/Feed/ManagerView', 'Dash/Feed/MsgCollectionView',
    'text!Dash/Feed/layout.html', 'text!Dash/Feed/cnt-unshown.html'],

    function( App, Marionette, _, Race, ManagerView, MsgCollectionView, tplFeed, counterTemplate) {

        var counterView = Marionette.ItemView.extend({
            className: 'cont-counter',
            template: _.template(counterTemplate),
            modelEvents: {
                "change:_is_scrolling": "listenScroll",
                "change:_unshown": "render"
            },
            initialize: function(){
                this.listenTo(App.vent, 'feed:add', this.incCounter);
                this.listenTo(App.vent, "feed:scrolling:"+this.model.get('_id'), this.scrollingState);
            },
            listenScroll: function(){
                if(!this.model.get('_is_scrolling')){
                    $(this.$el).slideUp('fast');
                }
            },
            incCounter: function(data){
                if(data.race_id == this.model.get('_id') && this.model.get('_is_scrolling')){
                    this.model.set('_unshown', this.model.get('_unshown') + 1);
                    if( $(this.$el).is(':hidden') ){
                        $(this.$el).slideDown('fast');
                    }
                }
            },
            scrollingState: function(state){
                this.model.set('_is_scrolling',state);
                if(!this.model.get('_is_scrolling')){
                    this.model.set('_unshown', 0);
                }
            }
        });

        return Marionette.LayoutView.extend( {
            
            model: Race,
            template: _.template(tplFeed),
            className: 'col-sm-x',
            
            _is_loading: false,

            regions: {
                Manager: ".Manager",
                Counter: ".Counter",
                Feeder: ".messages"
            },

            events: {
                // Scroller natif
                "click .Counter": function(){ $(this.Feeder.$el).scrollTop(0); },
                // NanoScroller
                // "click .Counter": function(){ $("ul", this.Feeder.$el).scrollTop(0); },
                "drop" : "drop",
            },

            drop: function(event, index) {
                this.$el.trigger('update-sort', [this.model, index]);
            },

            initialize: function(options){
                // Un model doit toujours être passé en options
                _.bindAll(this);

                this.listenTo(App.vent, 'feed:filtering:'+this.model.get('_id'), this.filterBy);
                this.listenTo(App.vent, 'feed:more:end:'+this.model.get('_id'), function(){ 
                    this._is_loading = false;
                });
                // this.listenTo(App.vent, 'feed:'+options.model.get('_id')+':item:added', this.refreshNano);
            },

            onRender: function(){
                this.$el.css('width', this.options.larg);
                this.showChildView('Manager', new ManagerView({model: this.model} ) );
                this.showChildView('Counter', new counterView({model: this.model }) );
                this.showChildView('Feeder', new MsgCollectionView({race_id: this.model.get('_id'), race: this.model }) );
                
                // listener pour le scroll natif. le 'off' se fait dans le onDestroy du layout
                $(this.Feeder.$el).on("scroll", this.feederScroll);

                App.socket.emit('join', this.model.get('_id'));

                // NanoScroller change les règles du jeu ...
                // $(this.Feeder.$el).on("update", this.feederNanoScroll);
                // @todo: unbind des events
                // $(this.Feeder.$el).bind("scrolltop", this.hideWaitingMsg);
                // $(this.Feeder.$el).bind("scrollend", this.feederNanoEnd);

            },

            // onDestroy: function() {
            //     // Scroller natif
            //     // console.log("Fermeture du feedLayout %o, off du on('scroll')", this.model.get('_id'));
            //     // $(window).off("scroll", this.feederScroll);

            //     // NanoScroller
            //     // console.log("Fermeture du feedLayout %o, off du on('update')", this.model.get('_id'));
            //     // $(window).off("update", this.feederNanoScroll);
            //     console.log("Fermeture d'un FeedLayout");
            // },

            hideWaitingMsg: function(){
                $(this.Feeder.$el).scrollTop(0);
                App.vent.trigger("feed:scrolling:"+this.model.get('_id'), false);
                var race_id = this.model.get('_id');
                $('.media:hidden', this.Feeder.$el).slideDown('fast', function(){
                    App.vent.trigger('feed:'+race_id+':item:added');
                });
            },

            filterBy: function(param){
                // find_where sur la collec mongo, pas vraiment un filter
                // nécessaire pour récupérer tous les stareds par ex
                var col = new MsgCollectionView(param);
                this.Feeder.show(col);
            },

            feederScroll: function(){
                var cur_race_id = this.model.get('_id');
                App.vent.trigger("feed:scrolling:"+cur_race_id, true);
                // console.log("on reprend les tests sur le scrolling ... %s", this._is_loading);
                if(!this._is_loading){
                    // Bandeau des messages non lus
                    var totalHeight = $("ul", this.Feeder.$el).height(),
                        scrollTop = $(this.Feeder.$el).scrollTop() + $(this.Feeder.$el).height(),
                        margin = 200;
                    // Si on dépasse 'margin' déclenchement de la lecture des archives pour cette Race
                    if (scrollTop + margin >= totalHeight && this.Feeder.currentView.collection.length >= 20) {
                        App.vent.trigger("feed:more:"+cur_race_id);
                        this._is_loading = true;
                    }else if((this.Feeder.$el).scrollTop() == 0){
                        // remise à zero par l'utilisateur, scroll manuel
                        this.hideWaitingMsg();
                    }
                }
            },

            // refreshNano: function(){
            //     this.Feeder.$el.nanoScroller();
            // },

            // feederNanoScroll: function(){
            //     var cur_race_id = this.model.get('_id');
            //     App.vent.trigger("feed:scrolling:"+cur_race_id, true);
            // },

            // feederNanoEnd: function(e){
            //     App.vent.trigger("feed:more:"+this.model.get('_id'));
            //     this._is_loading = true;
            // }

        });
    });
