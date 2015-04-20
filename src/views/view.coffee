class BackTree.View extends Backbone.View
	constructor : (options) ->
		_.extend @, _.pick(options, ['settings'])

		if !(@settings instanceof BackTree.Settings)
			@settings = new BackTree.Settings @settings

		super

	remove : ->
		@settings = null
		@model = null
		@collection = null

		return super