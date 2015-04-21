class BackTree.List extends BackTree.View
	tagName : 'ul'

	initialize : ->
		@initItemsView()

		@listenTo @collection, 'remove', @onModelRemove
		@listenTo @collection, 'add', @onModelAdd
		@listenTo @collection, 'reset', @onCollectionReset

	initItemsView : ->
		@children = {}
		@collection.forEach (model) =>
			@children[model.cid] = @settings.makeItem {
				model : model
			}

	render : ->
		_.each @children, (child) =>
			@$el.append child.render().$el

		return @

	open : (animation = true) ->
		if animation && @settings.get('animation')
			@$el.slideDown 200
		else
			@$el.show()

	close : (animation = true) ->
		if animation && @settings.get('animation')
			@$el.slideUp 200
		else
			@$el.hide()

	onModelRemove : (model) ->
		@children[model.cid].remove()
		delete @children[model.cid]

	onModelAdd : (model) ->
		index = @collection.indexOf(model)

		child = @settings.makeItem {
			model : model
		}
		child.render()

		if index == 0
			@$el.prepend child.$el
		else
			$prev = @$("> .bt-item:eq(#{index - 1})")

			if !$prev.size()
				throw new Error "Previous el not found!"

			child.$el.insertAfter $prev

		@children[model.cid] = child

	onCollectionReset : ->
		_.each @children, (child, key) =>
			child.remove()

		@initItemsView()
		@render()

	remove : ->
		_.each @children, (child, key) ->
			child.remove()

		@children = {}

		return super