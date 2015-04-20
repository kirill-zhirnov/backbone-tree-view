class BackTree.Placeholder extends BackTree.View
	tagName : 'li'

	className : 'bt-item placeholder'

	initialize : (options) ->
		_.extend @, _.pick(options, ['replacedView'])

	placeholderToEl : ->
		@$el.css {
			width: "#{@replacedView.$el.outerWidth()}px"
			height: "#{@replacedView.$el.outerHeight()}px"
		}

		@replace @replacedView.$el, @$el

	elToPlaceholder : ->
		@replace @$el, @replacedView.$el

	replace : (from, to) ->
		prev = from.prev()
		if prev.size() > 0
			to.insertAfter prev
		else
			from.parent().prepend to

	remove : ->
		@replacedView = null

		return super

