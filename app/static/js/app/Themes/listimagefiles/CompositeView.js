
define(['App', 'marionette', 'Themes/listimagefiles/ItemView', 'text!Themes/listimagefiles/composite.html'],
    function(App, Marionette, FileItemView, tplComposite) {

        return Marionette.CompositeView.extend({
            /*
            @todo:
            Factoriser ça en composant au plus vite
            le model de la compositeView devrait encaisser:
            - pathfile
            - form-name
            */
        	template: _.template(tplComposite),
            childView: FileItemView,
            childViewContainer: '.dropdown-menu',
            ui: {
            	formFile: '.form-file',
            	labelActiveFile: '.active-file',
                thumbPreview: '.thumb-preview'
            },
            childEvents: {
				'file:selected': function(file) {
					this.ui.formFile.val(file.model.get('path'));
					// this.model.set('file', file.model.get('identifier'));
                    this.ui.labelActiveFile.html(file.model.get('path'));
					this.ui.thumbPreview.attr({'src': file.model.get('path') });
                    App.vent.trigger('theme:haschanged');
				}
            }
        });

    });