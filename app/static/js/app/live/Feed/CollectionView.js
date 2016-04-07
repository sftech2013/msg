
define(['live', 'marionette', 'underscore', "models/Item", "models/Race", "live/Feed/MsgView", "live/modal/liveView", 
    "text!live/Feed/empty.html"],

  function(App, Marionette, _, Item, Race, MsgView, ModalView, emptyTemplate) {
    
    var NoItemsView = Marionette.ItemView.extend({
        template: _.template(emptyTemplate)
    });

    var msg_pause = {
        // @todo: msg_pause à passer dans le model Race. 
        // author, avatar pourrait venir d'un model 'Proprio' ?
        status: "new",
        visible: 1,
        prefs: {text: true, media: false, size: ""},
        message: 'message de pause',
        author: "@live_message",
        preselec: {type: "", index: ""},
        avatar: "/static/img/logo-b_120.png",
        ctime: "",
    }

    var ItemCollectionView = Marionette.CollectionView.extend({

        childView: MsgView,
        emptyView: NoItemsView,
        tagName: 'ul',
        className: 'list-group media-list',

        initialize: function(options) {
            this.race = options.race;
            this.childViewOptions = { current_race_id: this.race.get('_id') };

            var globalCh = Backbone.Wreqr.radio.channel('global');

            globalCh.vent.on('race:updated:'+this.race.get('_id'), this.updateRace, this);
            globalCh.vent.on('feed:add', this.addItem, this);
            globalCh.vent.on('feed:visible', this.setVisible, this);
            globalCh.vent.on('feed:stared', this.setStar, this);
            globalCh.vent.on('bubble:exec:open', this.openBubble, this);
            globalCh.vent.on('bubble:exec:destroy', this.destroyBubble, this);
            globalCh.vent.on('dumber:added', this.refetch, this);
            globalCh.vent.on('dumber:removed', this.refetch, this);
        },

        onRender: function(){
            if(!window.screenshot){     // pénible 
                if(this.race.get('status') == "stopped"){
                    this.setPauseRace();
                }else{
                    this.destroyBubble();
                }
            }
        },

        attachHtml: function(collectionView, childView, index){

            // le buffer n'est actif que sur fetch et reset: il ne peut pas y avoir de 'new' bufferisés
            // if (collectionView.isBuffering && childView.model.get('status') == "new") {
            if (collectionView.isBuffering) {
                // buffering happens on reset events and initial renders
                // in order to reduce the number of inserts into the
                // document, which are expensive.
                if(childView.model.get('status') == "new"){
                    collectionView._bufferedChildren.push(childView);
                }else{
                    collectionView._bufferedChildren.splice(0, 0, childView);
                }
            }
            else {
                if(childView.model.get('status') == "new"){
                    collectionView.$el.prepend(childView.$el.hide());
                }else{
                    collectionView.$el.append(childView.$el.hide());
                }
                if(childView.model.get('visible')){
                    childView.$el.slideDown("fast");
                }
            }
        },

        // Called after all children have been appended into the elBuffer
        attachBuffer: function(collectionView) {
            collectionView.$el.append(this._createBuffer(collectionView));
        },

        // called on initialize and after appendBuffer is called
        initRenderBuffer: function() {
            // this.elBuffer = document.createDocumentFragment();
            this._bufferedChildren = [];
        },

        addItem: function(data){
            this.collection.add(data);
            this.removeOld();
        },

        removeOld: function(){
            // @todo: passer la limite en config ou en param pour les clients comme pour l'API
            var max = 50;
            if(this.collection.length >= max){
                var diff = this.collection.length - max;
                for(i=0; i<diff; i++){
                    var out = this.collection.shift();
                    console.log("remove one: ", out);
                }
            }
        },

        setVisible: function(data){
            console.log("toggle visible de %o", data['_id']);
            var msg = this.collection.get( data['_id']);
            msg.set('visible', data['visible']);
        },

        openBubble: function(data){
            this.destroyBubble();
            console.log("Ouverture d'une bubble, data: %o", data);
            var mod = new Item(data);
            var bub = new ModalView({model: mod});

            // FIXME tweak juste pour bloquer l'affichage des bulles pour MobilActeurs
            if($("#bubble").length){
                App.rootView.modalRegion.show(bub);
            }
        },

        destroyBubble: function(){
            if( App.rootView.modalRegion.currentView ){
                $(App.rootView.modalRegion.currentView.$el).modal('hide');
            }
        },

        setStar: function(data){
            console.log("toggle star de %o", data['_id']);
            var msg = this.collection.get( data['_id']);
            msg.set('stared', data['stared']);
        },

        // FIXME move to Controller
        updateRace: function(data){
            this.race.set(data.race);
            if(this.race.hasChanged("status")) {
                console.log("le status de la Race a changé");
            }
            if(this.race.get('status') == "stopped"){
                this.setPauseRace();
            }else{
                // FIXME tweak juste pour bloquer l'affichage des bulles pour MobilActeurs
                if($("#bubble").length){
                    this.destroyBubble();
                }
            }
        },

        // FIXME move to Controller
        setPauseRace: function(){
            msg_pause['ctime'] = moment();
            var msg = App.getOption('settings').msg_pause;
            // FIXME test sur #bubble: tweak juste pour bloquer l'affichage des bulles pour MobilActeurs
            if($("#bubble").length){
                msg_pause['message_html'] = msg;
                var mod = new Item(msg_pause);
                var bub = new ModalView({model: mod});
                App.rootView.modalRegion.show(bub);
            }else{
                msg_pause['message'] = msg;
                this.addItem(msg_pause);
            }
        },

        refetch: function(){
            console.log("refetch");
            this.collection.fetch();
        }

        
    });

    // Returns the Model class
    return ItemCollectionView;

  }

);
