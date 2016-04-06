define(["jquery","backbone", "Devices/model"],
	function($, Backbone, DeviceModel) {
		return Backbone.Collection.extend({
			model: DeviceModel,
			url: '/admin/devices'
		});
	});