class BackTree.Model extends Backbone.TreeModel
	defaults :
		open : false

	getTitle : ->
		return @get 'title'

	hasChildren : ->
		return !!@nodes()