define([ 'App', 'marionette', 'underscore', 'text!Header/header.html'],
    function (App, Marionette, _, tplHeader) {
        //ItemView provides some default rendering logic
        return Marionette.LayoutView.extend({

            template:_.template(tplHeader),
            className: "container-fluid",

            regions: {
                AppTitle: "#AppTitle",
                Nav: "#Nav",
            },

            ui: {
                HBTwitter: "#HeaderBox .HBTwitter",
                alerter: ".alert-msg",
                btnStream: ".toggle-stream",
                btnStopStream: ".stop-stream",
                streamStateLabel: ".stream-state-label"
			},

            initialize: function(options){
                this.require_refresh = false;
                this.listenTo(App.vent, 'stream:restart:required', this._restartRequired);
                this.listenTo(App.vent, 'stream:start', this.setStream);
                this.listenTo(App.vent, 'stream:stop', this.stopStream);
                this.listenTo(App.vent, 'stream:locked', this.lockStream);              // @todo: plus de locker sur le Stream
                this.listenTo(App.vent, 'stream:unlocked', this.unlockStream);
                this.listenTo(App.vent, 'stream:error', this._gotAnError);
                this.listenTo(App.vent, 'socket:disconnected', this._disconnecting);
                this.listenTo(App.vent, 'socket:connected', this._connecting);
                // console.log("la config twitter est actuellement : %o", this.model.get('twitter_account'));
                // this.model.set('title', App.request('getPref','title'));
            },

            events: {
                // "click .toggle-stream": "onToggleStream",
                "click @ui.btnStream": "clickStartStream",
                "click @ui.btnStopStream": "clickStopStream"
            },

            // delayRestart: function(){
            //     this.onStopStream();
            //     var that = this;
            //     setTimeout(function(){
            //         that._restartStream();
            //     }, 20000);
            // },

            clickStartStream: function(){
                $.post('/twitter/stream/start', function(data){
                    console.log(data);
                });
            },

            clickStopStream: function(){
                $.post('/twitter/stream/stop', function(data){
                    console.log(data);
                });
            },

            setStream: function(data){

                this.model.set(data);
                // Sans déconner ... c pas bo ca
                // FIXME et surtout ca ne marche pas
                if(this.model.get('status') == "started"){
                    this.ui.streamStateLabel.text('');
                    $(this.ui.btnStopStream).addClass('btn-success').removeClass('btn-danger disabled');
                    $(this.ui.btnStream).addClass('btn-success').removeClass('btn-danger required');
                    $('span', this.ui.btnStream).addClass('glyphicon-retweet').removeClass('glyphicon-play');
                }else{
                    this.ui.btnStream.addClass('btn-danger required').removeClass('btn-success');
                    this.ui.streamStateLabel.text('Start Twitter');
                    $('span', this.ui.btnStream).addClass('glyphicon-play').removeClass('glyphicon-retweet');
                }
            },

            stopStream: function(data){
                // console.log("restour serveur: %o", data);
                $(this.ui.btnStopStream).addClass('btn-danger disabled').removeClass('btn-success');
                $(this.ui.btnStream).addClass('btn-danger required').removeClass('btn-success');
                this.ui.streamStateLabel.text('Start Twitter');
                $('span', this.ui.btnStream).addClass('glyphicon-play').removeClass('glyphicon-retweet');
            },

            lockStream: function(data){
                console.log("Stream locked");
                this.ui.btnStream.attr({disabled: 'disabled'});
            },

            unlockStream: function(data){
                console.log("Stream unlocked");
                this.ui.btnStream.removeAttr("disabled");
            },

            _gotAnError: function(err){
                this.ui.alerter.html("Attention ! Erreur: "+err['status_code'])
                    .addClass('btn-danger')
                    .removeClass('btn-warning btn-success')
                    .show().delay(5000).fadeOut('slow');
            },

            _restartRequired: function(data){
                console.log("on passe dans restartRequired");
                this.ui.alerter.html("Redémarrage du Stream requis !")
                    .addClass('btn-danger')
                    .removeClass('btn-warning btn-success')
                    .show().delay(5000).fadeOut('slow');

                // this.ui.btnStream.addClass('btn-danger').removeClass('btn-success btn-default');
                $('span', this.ui.btnStream).addClass('glyphicon-retweet').removeClass('glyphicon-play');

                // $(this.ui.btnStopStream).addClass('disabled');
                $(this.ui.btnStopStream).removeClass('disabled');
                $(this.ui.btnStopStream).addClass('btn-danger').removeClass('btn-success');
                $(this.ui.btnStream).addClass('btn-danger required').removeClass('btn-success');
                this.ui.streamStateLabel.text('Relancer le Stream');
                $('span', this.ui.btnStream).addClass('glyphicon-retweet').removeClass('glyphicon-play');
            },


            ////////////// Socket.io

            _connecting: function(){
                this.ui.alerter.html("Connecté !")
                    .addClass('btn-success')
                    .removeClass('btn-danger')
                    .show().delay(5000).fadeOut('slow');
                if(this.require_refresh){
                     // FIXME Déconnection/reconnection socketio et refresh manuel

                    // tout ca pour gérer la reconnexion, et plus précisement le fait que les devices
                    // sont perdus dans le ColMenu et que les compteurs ne suivent pas (inc/dec c pas top dans ce cas)
                    // ya aller comme un bourrin en 'navigant' vers le dash ne reinit pas le ColMenu ...
                    // App.appRouter.navigate('#reconnecting', true);
                    // App.appRouter.navigate('/', true);
                    // donc, allons-y gaiement pour l'instant, retour sur la home ...
                    // document.location.href = '/';

                    // fonctionne, mais pas glop, ca ne fait que déplacer le problème au click sur le bouton
                    // var that = this;
                    // window.setTimeout(function(){
                    //     // document.location.href = '/';
                    //     that.ui.alerter.html('Rafraichissement conseillé ! <a href="/">Accueil</a>')
                    //         .addClass('btn-danger')
                    //         .removeClass('btn-success')
                    //         .show();
                    // }, 6000);
                    
                    // @WIP:
                    // Donc retour à la méthode sauvage - qui pose problème dans Firefox - on redirige sur la Home...
                    // Pb dans Firefox: à la reconnection socketio le redirect se fait bien vers la home comme prévu, mais,
                    // quand on ne fait que rafraichir le browser (Ctrl/R, F5) ce redirect est lui aussi pris en compte 
                    // et on se retrouve sur la home, ce qui est particulièrement pénible en devel ... pas le cas dans Chrome ...

                    // désactivé pour voir l'impact...
                            // document.location.href = '/';

                    // @todo: tester en ajoutant un listener "socket:disconnected" pour gérer les regions dans le controller, 
                    // ce n'est pas le taf du headerLayout de toute façon !

                }
            },

            _disconnecting: function(){
                // 
                this.require_refresh = true;
                this.ui.alerter.html("Socket déconnecté !")
                    .addClass('btn-danger')
                    .removeClass('btn-success')
                    .show();
            }

        });
    });