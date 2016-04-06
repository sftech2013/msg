
define(['App', 'marionette', 'Themes/dropdown/ItemView', 'text!Themes/dropdown/composite.html'],
    function(App, Marionette, ThemeItemView, tplComposite) {

        return Marionette.CompositeView.extend({
        	template: _.template(tplComposite),
            childView: ThemeItemView,
            childViewContainer: '.dropdown-menu',
            ui: {
            	formTheme: '#formTheme',
            	labelActiveTheme: '.active-theme',
                linkEditor: '.link-editor a'
            },
            initialize: function(options){
                this.model.set('is_designer', options.is_designer);
            },
            childEvents: {
				'theme:selected': function(theme) {
					this.ui.formTheme.val(theme.model.get('identifier'));
					this.model.set('theme', theme.model.get('identifier'));
					this.ui.labelActiveTheme.html(theme.model.get('identifier'));
				}
            },
            events: {
                "click @ui.linkEditor": "navEditor"
            },
            navEditor: function(){
                if(this.model.get('is_idesigner')){
                    App.appRouter.navigate('#themes/edit/'+this.model.get('theme'), true);
                }else{
                    console.log("Options Designer désactivée");
                }
            }
        });

    });