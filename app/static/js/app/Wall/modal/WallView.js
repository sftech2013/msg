
define(['Wall', 'marionette', 'underscore', 'moment', 'text!Wall/modal/item-wall-modal.html'],

  function(App, Marionette, _, moment, modalTemplate) {

    var ModalView = Marionette.ItemView.extend({
        template: _.template(modalTemplate),
        className: 'modal fade vertical-alignment-helper',

        ui: {
            Preselect: "#preselect",
            modalDialog: ".modal-dialog",
            modalContent: ".modal-content",
            modalBody: ".modal-body",
            imgTarget: ".target"
        },

        initialize: function(options){
            this.model.set('ctime_str', moment(this.model.get('ctime')).format('HH:mm:ss'));
            if(this.model.get('provider') == "SMS"){
                this.model.set('author', "SMS");
            }

            var pre = this.model.get('preselec');

            // @todo: Ca se factorise ça
            if(pre['type'] == "media" && this.model.get('medias').length){
                var med = this.model.get('medias');
                var size = med[pre['index']]['big_sizes'];
                var rt = this.resizeThat({
                    width: size.w,
                    height: size.h,
                    maxwidth: $(window).width(),
                    maxheight: $(window).height() - 60
                });
                this.model.set({ final_width: rt.width, final_height: rt.height});
            }

            if(pre['type'] == "link" && this.model.get('links').length){
                var links = this.model.get('links');
                var embeded = links[ pre.index ]['embedly'] || links[ pre.index ].get('embedly');
                var original_w = embeded.width || embeded.thumbnail_width;
                var original_h = embeded.height || embeded.thumbnail_height;
                var rt = this.resizeThat({
                    width: original_w,
                    height: original_h,
                    maxwidth: $(window).width() - 60,
                    maxheight: $(window).height() - 60
                });
                this.model.set({ final_width: rt.width, final_height: rt.height});
            }

        },

        _onFinishRender: function(){
            var pre = this.model.get('preselec');
            if(pre.type == 'link'){
                var links = this.model.get('links');
                var embeded = links[ pre.index ]['embedly'] || links[ pre.index ].get('embedly');

                if(embeded.type == "video"){
                    $("iframe", this.ui.Preselect).width( this.model.get('final_width') );
                    $("iframe", this.ui.Preselect).height( this.model.get('final_height') );
                }

            }
        },

        onRender: function(){
            var pre = this.model.get('preselec');
            if( !pre['type'] ){
                this.ui.modalDialog.addClass('simple-bubble')
            }
            this.ui.modalDialog.removeClass('modal-lg').width( this.model.get('final_width') );
        	this.$el.modal('show');
            // $(App.rootView.modalRegion.currentView.$el).modal('show');
        },

        // @verif: les self.close() sur les modales () (fermeture depuis le client) trigge sa fermeture au Dash ?
        onDestroy: function(){
        	$(".modal-backdrop").fadeOut(200).remove();
        },

        // @todo:
        // A sortir de là et à rendre dispo plus facilement, c'est loin d'être spécifique aux modales
        resizeThat: function(params){
            var aspectRatio = 0;
            var rw = params.width;
            var rh = params.height;

            // We cannot do much unless we have one of these
            if ( !params.maxheight && !params.maxwidth ) {
                return this;
            }

            // Calculate aspect ratio now, if possible
            if ( params.maxheight && params.maxwidth ) {
                aspectRatio = params.maxwidth / params.maxheight;
            }

            var imgHeight = params.height
                , imgWidth = params.width
                , imgAspectRatio = imgWidth / imgHeight
                , bxHeight = params.maxheight
                , bxWidth = params.maxwidth
                , bxAspectRatio = aspectRatio;

            // Work the magic!
            // If one parameter is missing, we just force calculate it
            if ( !bxAspectRatio ) {
                if ( bxHeight ) {
                    bxAspectRatio = imgAspectRatio + 1;
                } else {
                    bxAspectRatio = imgAspectRatio - 1;
                }
            }

            // Only resize the images that need resizing
            if ( (bxHeight && imgHeight > bxHeight) || (bxWidth && imgWidth > bxWidth) ) {

                if ( imgAspectRatio > bxAspectRatio ) {
                    bxHeight = ~~ ( imgHeight / imgWidth * bxWidth );
                } else {
                    bxWidth = ~~ ( imgWidth / imgHeight * bxHeight );
                }

                rh = bxHeight;
                rw = bxWidth;
            }

            return {width: rw, height: rh}
        }

    });

    return ModalView;

  }
);