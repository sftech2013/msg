define(["jquery","backbone","models/Race"],
    function($, Backbone, Race) {

        var RaceCollection = Backbone.Collection.extend({

            model: Race,
            url: function(filter, value) {
                // @todo: remplacer ca par un vrai objet param dans la collection. et concat: url = url+'?'+$.param( objparam )
            	var param = (filter) ? "?_filter_"+filter+"="+value : "";
            	return "/races/"+param;
            },

            initialize: function(options){
                // passage des args/filtres en options pour construire l'url de la collection
                if(!_.isUndefined(options)){
                    this.url = this.url(options.filter, options.filter_values);
                }
            },

            byFilter: function(filter, filter_values) {
                filtered = this.filter(function(race) {
                    if(filter_values && _.isString(filter_values)){
                        var values = filter_values.split(',');
                    }
                    if(filter == "status"){
                        return _.contains(values, race.get(filter))
                    }else if(filter == "bundle"){
                        return _.contains(values, race.get("_id"))
                    }else if(filter == "dashed"){
                        return (race.get("is_dashed"))
                        // return if(race.get("is_dashed")) { race }
                    }else{
                        return race;
                    }
                });
                return new RaceCollection(filtered);
            },

            // plus de sort sur les Races. 
            // C'est à cause du sort qu'il y a un rerender de toute la collection si l'ajout ou la suppression 
            // de Races ne se fait pas dans l'ordre voulu par le sort...
            // comparator: function(model) {
            //     return model.get('order');
            // }

        });

        return RaceCollection;
    });
