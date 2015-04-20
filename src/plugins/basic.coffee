class BackTree.plugins.Basic
	constructor : (options) ->
		_.extend @, _.pick(options, ['collection', 'settings'])

		@initialize.apply @, arguments

	initialize : ->

	remove : ->
		@stopListening()
		@collection = null
		@settings = null

		return @

_.extend BackTree.plugins.Basic.prototype, Backbone.Events