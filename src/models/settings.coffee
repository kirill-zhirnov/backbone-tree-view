class BackTree.Settings extends Backbone.Model
	defaults:
		animation : true
		$root : null
		plugins : []
		dndSkipMove : ['.btn', '.no-dnd']
		ItemConstructor : BackTree.Item
		ListConstructor : BackTree.List
		touch : true
		checkbox : false

	makeItem : (options = {}) ->
		_.extend options, {
			settings : @
		}

		Constructor = @get('ItemConstructor')
		return new Constructor(options)
