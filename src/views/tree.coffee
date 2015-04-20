class BackTree.Tree extends BackTree.View
	className : 'bt-bootstrap'

	initialize : ->
		@child = null
		@plugins = []
		@settings.set '$root', @$el

		if _.isArray(@collection)
			@collection = new BackTree.Collection @collection

		if !@collection || !(@collection instanceof BackTree.Collection)
			throw new Error 'You must specify @collection and it should be instance of BackTree.Collection.'

		@initPlugins()

	initPlugins : ->
		_.each @settings.get('plugins'), (options, plugin) =>
			@plugins.push new BackTree.plugins[plugin](_.extend({
				collection : @collection
				settings : @settings
			}, options))

	render : ->
		@child = new BackTree.List {
			collection : @collection
			settings : @settings
			className : 'bt-root'
		}
		@$el.append @child.render().$el

		return @

	remove : ->
		if @child
			@child.remove()
		@child = null

		_.each @plugins, (plugin, key) ->
			plugin.remove()
		@plugins = []

		@settings.set '$root', null

		return super