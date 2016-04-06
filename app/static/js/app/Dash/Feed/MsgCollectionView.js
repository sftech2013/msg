
define(['App', 'underscore', 'backbone', 'marionette', "collections/ItemCollection", "Dash/Feed/MsgView", 'text!Dash/Feed/empty-view.html'],

  function(App, _, Backbone, Marionette, ItemCollection, MsgView, emptyTemplate) {
    
    var NoItemsView = Marionette.LayoutView.extend({
        template: _.template(emptyTemplate),
        className: "list-group-item media item-msg no-item",
        tagName: 'li'
    });

    var MsgCollectionView = Marionette.CollectionView.extend({

        childView: MsgView,
        emptyView: NoItemsView,
        tagName: 'ul',
        className: 'list-group media-list nano-content',

        filter: '',
        _is_scrolling: false,
        _last_ctime: '',

        initialize: function(options) {
            this.race_id = options['race_id'];
            this.filter = (options['filtering']) ? options['filtering'] : '';
            this.collection = new ItemCollection();

            // ca marche mais c bizarre d'en passer par là ...
            this.collection.url = this.collection.url(this.race_id, this.filter);
            this.collection.fetch();

            this.listenTo(App.vent, 'feed:add', this.addItem);
            this.listenTo(App.vent, 'feed:visible', this.setVisible);
            this.listenTo(App.vent, 'feed:stared', this.setStar);
            this.listenTo(App.vent, 'feed:more:'+this.race_id, this.loadMoreMsg);
            
            this.listenTo(App.vent, 'feed:scrolling:'+this.race_id, this.scrollingState);
            this.listenTo(App.vent, 'dumber:added', this.removeDumberMsg);
            this.listenTo(App.vent, 'remove:messages:'+this.race_id, this.removeMessages);
            // au click sur un bouton bubble, on désactive les autres
            this.on("childview:bubble:open", this.deactive_bubble);
            // au click cur un bouton de fermeture externe à la CV, on désactive
            this.listenTo(App.vent, 'bubble:exec:destroy', this.deactive_bubble_ext);
        },

        onRender: function(){
            // @verifié: on passe 2 fois dans le render à l'init ?
            // comportement normal, on passe une première fois dans le render pour afficher l'emptyView
        },

        scrollingState: function(state){
            this._is_scrolling = state;
        },

        attachHtml: function(collectionView, childView, index){
            if (collectionView.isBuffering) {
                // pas sur de l'utilité de ce test, revient au meme
                if(childView.model.get('status') == "new"){
                    collectionView._bufferedChildren.push(childView);
                }else{
                    collectionView._bufferedChildren.splice(0, 0, childView);
                }
            }else{
                if(childView.model.get('status') == "new"){
                    // @todo: passer en transition css
                    collectionView.$el.prepend(childView.$el.hide());
                    if(!collectionView._is_scrolling){

                        var race_id = childView.model.get('race_id');
                        childView.$el.slideDown("fast", function(){
                            App.vent.trigger('feed:'+race_id+':item:added');
                        });
                    }
                }else{
                    // sans effet de slide ...moins bourin, tiens mieux la charge
                    // childView.$el.slideDown("fast");
                    collectionView.$el.append(childView.$el);
                }
            }
        },

        // Called after all children have been appended into the elBuffer
        attachBuffer: function(collectionView) {
            collectionView.$el.append(this._createBuffer(collectionView));
        },

        // called on initialize and after attachBuffer is called
        initRenderBuffer: function() {
            // this.elBuffer = document.createDocumentFragment();
            this._bufferedChildren = [];
        },

        loadMoreMsg: function(){
            // @todo: remplacer ca par un vrai objet param dans la collection. et concat: url = url+'?'+$.param( objparam )
            // ya fatalement un blem avec les collections vides ... ca se produit, mais quand ???
            var older = this.collection.first();
            this._last_ctime = moment(older.get('ctime')).unix() * 1000;
            this.collection.url += "?_last_ctime="+this._last_ctime;
            // mixer ca avec les 'filter' et la cible (race_id) ... faire ça ou ?
            // les filters sont moyennement bien gérés, en partie dans l'init ici et dans la collection
            // ... en fin de compte c ptet dans le layout et au fond de la collection que ca serait le mieux géré
            // le layout pour injecter facilement des infos aux managers

            var that = this;
            this.collection.fetch({
                remove: false,
                success: function(){
                    that.collection.sort();
                    that.collection.url = "/messages/"+that.race_id;
                    // @todo: lancer le trigger après le rendu et pas après le fetch, sinon _is_loading repasse à false trop tot
                    // plutot que fetch, un deferred sur la collection avec un listenTo sur le 'render', comme dans DashController._initialContent()
                    // passer en param le nbr de rep ? 
                    App.vent.trigger('feed:more:end:'+that.race_id);
                }
            });
        },

        // @FIXME ne doit plus marcher, maj Marionette 2.0.1
        onBeforeClose: function(){
            // ca vire des models au passage mais pas tous ... comprend po ...
            // @todo: comparer avec le onDestroy de FeedItemCollection qui tourne bien
            var that = this;
            _.each(this.collection.models, function (item) {
                that.collection.remove(item);
            }, this);
        },

        addItem: function(data){
            if(data.race_id == this.race_id){
                this.collection.add(data);
                this.removeOld();
            }
        },

        removeOld: function(){
            // @todo: passer la limite en config ou en param pour les clients comme pour l'API
            var max = 40;
            if(this.collection.length >= max && !this._is_scrolling){
                var diff = this.collection.length - max;
                for(i=0; i<diff; i++){
                    var out = this.collection.shift();
                }
            }
        },

        setVisible: function(data){
            // pénible ... comment faire sans en multirace/colonne
            // @todo: passer à du 'feed:visible:'+this.race_id si c'est pas trop bourrin
            if(data.race_id == this.race_id){
                var msg = this.collection.get( data['_id']);
                msg.set('visible', data['visible']);
            }
        },

        setStar: function(data){
            if(data.race_id == this.race_id){
                var msg = this.collection.get( data['_id']);
                msg.set('stared', data['stared']);
            }
        },


        deactive_bubble: function(childview){
            // listener qui reset tous les boutons bubble de la race au click sur 
            // un bouton bubble d'un item
            var that = this;
            this.children.each(function(msg){
                if(msg.model.get('_id') != childview.model.get('_id')){
                    that._unsetBtn(msg);
                }
            })
        },

        deactive_bubble_ext: function(race_id){
            // listener qui reset tous les boutons bubble de la race au click sur 
            // le bouton général dans le Manager de la Race
            if(race_id == this.race_id){
                var that = this;
                this.children.each(function(msg){
                    that._unsetBtn(msg);
                })
            }
        },

        _unsetBtn: function(msg){
            var btn = $('.bubble-destroy', msg.$el);
            $(btn).removeClass('btn-warning').addClass('btn-default')
                  .removeClass('bubble-destroy').addClass('bubble');
        },

        removeDumberMsg: function(dumber){
            // un peu trop bourrin
            // edit: on revient sur un fetch depuis le chiffrement des n° de phone
            // @todo: ca peut se reprendre maintenant que le provider_user_id est de nouveau unique
            this.collection.fetch();
            // En bouclant sur la collec directement on se retrouve avec un 'item'
            // qui est en fait la collection de models. Pb dans le appendHtml avec le buffer ?
            // var that = this;
            // this.children.each(function(view){
            //     if(view.model.get('provider_user_id') == dumber.provider_user_id){
            //         view.$el.slideUp('fast', function(){
            //             that.collection.remove(view.model);                            
            //         });
            //     }
            // })
        },

        removeMessages: function(){
            var that = this;
            Backbone.sync('delete', this.collection, {
                success: function(data){
                    console.log(data);
                    that.collection.fetch({
                        success: function(){
                            App.vent.trigger('messages:removed');
                        }
                    });
                }
            });
        }

        
    });

    // Returns the Model class
    return MsgCollectionView;

  }

);