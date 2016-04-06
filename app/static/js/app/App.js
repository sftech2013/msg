define(['jquery', 'backbone', 'marionette', 'underscore', 'socketio', 'Modal/Region'],
    function ($, Backbone, Marionette, _, io, ModalRegion) {

    if(!window.debugging){
        console = {};
        console.log = function(){};
    }
    
    App = new Backbone.Marionette.Application();

    App.addRegions({
        headerRegion:"header",
        mainRegion:"#main",
    });

    // @size: classname pour la taille de la modale (de l'admin)
    // normal : '' | small : 'modal-sm' | large : 'modal-lg'
    var optionsModale = {
        small: {size: '', text: true, media: false},
        large: {size: 'modal-lg', text: false, media: true}
    };

    // modalRegion ne se retrouve pas dans App.getRegions(), normal ?
    App.modalRegion = new ModalRegion(optionsModale);

    /* Navigation principale
    Construction du menu principale du <header>. Factorisation du model des boutons, des events associés, [compteur d'items]
        @name: identifiant, sert à la construction de l'event à trigger au clic
        @label: label servant pour Intitulé du bouton
        @url: url de l'AppRouter
        @counter: hash optionnel
    hash Counter: ajoute un compteur de collection aux boutons + events génériques pour inc/dec/update:
    Event Socket.io et args correspondant:
        <labelEvent>:inc    incrémentation du compteur
            @param: l'objet à ajouter
        <labelEvent>:dec    décrementation du compteur
            @param: id de l'objet à supprimer
        <labelEvent>:update (re)initialisation de collection
            @param: Backbone.Collection générique des objets à "compter"
    */

    App.navigation = [
        // {name: 'dashboard', label: 'Dashboard', url: '#filter/status/started,stopped'},
        {name: 'dashboard', label: 'Dashboard', url: '#'},
        {name: 'devices', label: 'Devices', url: '#devices', counter: {labelEvent: 'device:waiting', value: 0}},
        // ajout du menu Thèmes dans l'AdminController, pas terrible
        // {name: 'themes', label: 'Thèmes', url: '#themes/list'},
        {name: 'preferences', label: 'Options', url: '#options'}
    ];


    /*
    Options / Préférences
    Sub Navigation du menu 'Options' (vraiment mal nommé, ne pas confondre avec App.prefsGenerales )
    */

    App.preferences = [
        {name: 'general', label: 'Général', url: '#options/general'},
        {name: 'dumbers', label: 'Bannis', url: '#options/dumbers'}
    ];

    App.themesnav = [
        {name: 'list', label: 'Bibliothèque', url: '#themes/list'},
        // {name: 'edit', label: 'Edition', url: '#themes/edit'}
    ];

    function isMobile() {
        var ua = (navigator.userAgent || navigator.vendor || window.opera, window, window.document);
        return (/iPhone|iPod|iPad|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
    }

    App.mobile = isMobile();

    App.socket;
    App.socketUrl = "/shouts";

    var init_socketio = function() {

        var socket_callbacks = [
            ['connect','socket:connected'],
            ['disconnect','socket:disconnected'],
            ['prefs_updated','prefs:updated'],
            ['stream-start','stream:start'],
            ['stream-stop','stream:stop'],
            ['stream-locked','stream:locked'],
            ['stream-unlocked','stream:unlocked'],
            ['stream-error','stream:error'],
            ['new_race', 'race:added'],
            ['message_to_race', 'feed:add'],
            ['increment_race', 'race:inc'],
            ['visible', 'feed:visible'],
            ['stared', 'feed:stared'],
            ['openbubble', 'bubble:exec:open'],
            ['destroybubble', 'bubble:exec:destroy'],
            // Devices
            ['device_waiting_inc', 'device:waiting:inc'],
            ['device_waiting_dec', 'device:waiting:dec'],
            ['join_a_wall', 'device:wall:join'],
            ['leave_a_wall', 'device:wall:leave'],
            // ['device_disconnected', 'device:disconnected'],      // inutilisé, peut servir
            // Dumbers
            ['dumber_added', 'dumber:added'],
            ['dumber_removed', 'dumber:removed'],
            // Walls
            ['ping', 'remote:ping'],
            ['gotourl', 'remote:gotourl'],
            // Themes
            ['theme_updated', 'theme:updated'],
        ];

        App.socket = io.connect(App.socketUrl);

        _.each(socket_callbacks,function(signal){
            App.socket.on(signal[0], function(data) {
                if (typeof(data) != "undefined") {
                    console.log('trigger %s | %o',signal[1],data);
                    App.vent.trigger(signal[1],data);
                } else {
                    console.log('trigger %s',signal[1]);
                    App.vent.trigger(signal[1]);
                }
            });
        });

        // event avec race_id dynamique en suffixe, traitement à part
        App.socket.on('race_updated', function(data){
            console.log("Race modifiée: %o", data['race']);
            App.vent.trigger("race:updated:"+data.race._id, data);
        });

        window.onbeforeunload = function(){
            App.socket.emit("leave_all");
        }
    };

    App.addInitializer(init_socketio);
    // App.on("before:start", init_socketio);
    // App.on("start", init_socketio);

    App.addInitializer(function (options) {
        Backbone.history.start();
        // Backbone.history.start({ pushState: true }, root= '/');
    });

    return App;
});