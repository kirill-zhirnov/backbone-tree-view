class BackTree.plugins.DnD extends BackTree.plugins.Basic
	initialize : (options) ->
		@view = null

		@lastMousePosition = null
		@movementDirection = null

		@$overlapped = null
		@placeHolder = null
		@shift =
			x : 0
			y : 0

		@listenTo @collection, 'dragStart', @dragStart

		Backbone.$(document).on 'mousemove.backTree', Backbone.$.proxy(@drag, @)
		Backbone.$(document).on 'mouseup.backTree', Backbone.$.proxy(@dragEnd, @)

		if @settings.get('touch')
			Backbone.$(document).on 'touchmove.backTree', Backbone.$.proxy(@drag, @)
			Backbone.$(document).on 'touchend.backTree touchcancel.backTree', Backbone.$.proxy(@dragEnd, @)

		@settings.get('$root').addClass('dnd')

		_.extend @, _.pick(options, ['changeParent'])
		_.defaults @, {
			changeParent : true
		}

	dragStart : (view, e) ->
#		validate target
		$target = Backbone.$ e.target

		skip = false
		$.merge($target, $target.parentsUntil('.bt-item')).each (key, el) =>
			$el = Backbone.$ el

			_.each @settings.get('dndSkipMove'), (selector) ->
				if $el.is(selector)
					skip = true

		if skip
			return

		e.preventDefault()
		if !$target.hasClass('bt-item')
			$target = $target.parents('.bt-item:eq(0)')

		if view.el isnt $target.get(0)
			return

		xy = @getXY(e)
		@view = view
		offset = @view.$el.offset()
		@shift.x = xy.x - offset.left
		@shift.y = xy.y - offset.top

		@createPlaceholder()
		@prepareDraggableEl()

		@lastMousePosition = null

		@moveAt e

	dragEnd : (e) ->
		if !@view
			return

		@setOverlapped null
		@removePlaceholder()
		@view.$el.removeClass 'bt-is-dragged'
		@view.$el.css {
			left: ''
			top: ''
			display: ''
			width: ''
			height: ''
		}

		@saveModelPosition()

		@view = null

	drag : (e) ->
		if !@view
			return

		@moveAt e
		@dragOver e

	getXY : (e) ->
		if _.indexOf(['touchstart', 'touchmove'], e.type) != -1 && touch = e.originalEvent.targetTouches[0]
			x = touch.pageX
			y = touch.pageY
		else
			x = e.pageX
			y = e.pageY

		return {
			x : x
			y : y
		}

	dragOver : (e) ->
		overlapped = @getOverlap e

		@setOverlapped overlapped.$el

		if !@$overlapped
			return

		if @$overlapped.hasClass('placeholder')
			@dragOverPlaceholder(overlapped)
		else
			@dragOverItem(overlapped)

	dragOverItem : (overlapped) ->
		if @changeParent && @shallAddAsChild(@$overlapped, overlapped.coef)
			@addAsChild @$overlapped
		else if @changeParent && $upper = @shallLevelUp(overlapped.coef)
			@placeHolder.$el.insertAfter $upper
		else if @movementDirection != 'eq'
			if !@changeParent && @$overlapped.parent().get(0) != @placeHolder.$el.parent().get(0)
				return

			next = overlapped.coef.vertical > 50
			if overlapped.direction == 'topLeft' || overlapped.direction == 'topRight'
				next = !next

			if next
				@placeHolder.$el.insertAfter @$overlapped
			else
				@placeHolder.$el.insertBefore @$overlapped

	dragOverPlaceholder : (overlapped) ->
		if !@changeParent
			return

		$upper = @shallLevelUp(overlapped.coef)
		if $upper
			view = $upper.data('view')
			@placeHolder.$el.insertAfter $upper
			return

		$parent = @shallLevelDown(overlapped.coef)
		if $parent
			@addAsChild $parent, 'append'
			return

	getOverlap : (e) ->
		offset = @view.$el.offset()
		width = @view.$el.outerWidth()
		height = @view.$el.outerHeight()

		elRectangle = [[offset.left, offset.top], [(offset.left + width), (offset.top + height)]]

		points =
			topLeft : [offset.left, offset.top]
			topRight : [(offset.left + width), offset.top]
			bottomLeft : [offset.left, (offset.top + height)]
			bottomRight : [(offset.left + width), (offset.top + height)]


		@view.$el.hide()
		els = {}
		_.each points, (point, key) ->
			x = point[0] - $(window).scrollLeft()
			y = point[1] - $(window).scrollTop()

			els[key] = document.elementFromPoint(x, y)
		@view.$el.show()

		max =
			coef : 0
			key : null

		_.each els, (el, key) =>
			$el = @getOverlappedEl(el)

			if !$el
				return

			els[key] =
				$el : $el
				coef : @calcOverlapCoefficient $el, points[key], key, elRectangle

			if els[key].coef.overlap > max.coef
				max.coef = els[key].coef.overlap
				max.key = key

		if !max.key
			return {
				$el : false
			}

		return {
			$el : els[max.key].$el
			point : points[max.key]
			direction : max.key
			coef : els[max.key].coef
		}

	calcOverlapCoefficient : ($overlappedEl, point, direction, elRectangle) ->
#		calc coefficient with > .wrapper:
		if $overlappedEl.hasClass('placeholder')
			$el = $overlappedEl
		else
			$el = $overlappedEl.find('> .wrapper')

		offset = $el.offset()
		width = $el.outerWidth()
		height = $el.outerHeight()

		overlappedRectangle = [[offset.left, offset.top], [(offset.left + width), (offset.top + height)]]

		overlappedLeftWidth = elRectangle[0][0] - overlappedRectangle[0][0]

		xOverlap = Math.max(0, Math.min(elRectangle[1][0], overlappedRectangle[1][0]) - Math.max(elRectangle[0][0], overlappedRectangle[0][0]))
		yOverlap = Math.max(0, Math.min(elRectangle[1][1], overlappedRectangle[1][1]) - Math.max(elRectangle[0][1], overlappedRectangle[0][1]))

		return {
			vertical : Math.round(yOverlap / height * 100)
#			left : Math.round(overlappedLeftWidth / width * 100)
			leftMargin : overlappedLeftWidth
			overlap: xOverlap * yOverlap
		}

	getOverlappedEl : (el) ->
		if !Backbone.$.contains(@settings.get('$root').get(0), el)
			return false

		$el = Backbone.$(el)

#		if over the placeholder - return
		if $el.hasClass('placeholder') && $el.hasClass('bt-item')
			return $el

		if !@doesElHaveView($el)
			$el = $el.parents('.bt-item:eq(0)')

			if $el.size() != 1 || !@doesElHaveView($el)
				$el = false

		return $el

	doesElHaveView : ($target) ->
		if $target.data('view') && $target.data('view') instanceof BackTree.Item
			return true

		return false

#	mode - string - prepend/append
	addAsChild : ($el, mode = 'prepend') ->
		view = $el.data('view')

		if !view.childList
			view.renderChildList()
			view.childList.open false
			$el.data('view').model.set 'open', true

		view.childList.$el[mode] @placeHolder.$el

	shallLevelDown : (coefficient) ->
		$prev = @$overlapped.prev('.bt-item:eq(0)')

		if $prev.size() && @doesElHaveView($prev) && coefficient.leftMargin > 30
			view = $prev.data 'view'

			if (view.model.hasChildren() && view.model.get('open')) ||  !view.model.hasChildren()
				if !view.childList
					view.renderChildList()
					view.childList.open false

				return $prev

		return false

	shallLevelUp : (coefficient) ->
		if coefficient.leftMargin < -30
			$parent = @$overlapped.parents('.bt-item:eq(0)')

			if $parent.size() && @doesElHaveView($parent)
				$children = $parent.find('> ul > .bt-item')

				if $children.size() > 0 && $children.index(@$overlapped) == ($children.size() - 1)
					return $parent

		return false

	shallAddAsChild : ($el, coefficient) ->
		view = $el.data 'view'
		shall = coefficient.leftMargin > 30

		if shall
			if view.model.hasChildren() && !view.model.get('open')
				view.model.set 'open', true
				return false

			if !view.childList
				view.renderChildList()
				view.childList.open false

		return shall

	moveAt : (e) ->
		xy = @getXY(e)

		left = xy.x - @shift.x
		top = xy.y - @shift.y

		@view.$el.css {
			left : "#{left}px"
			top: "#{top}px"
		}

		@movementDirection = null
		if @lastMousePosition
			if @lastMousePosition.y > xy.y
				@movementDirection = 'up'
			else if @lastMousePosition.y < xy.y
				@movementDirection = 'down'
			else
				@movementDirection = 'eq'

		@lastMousePosition = xy

	prepareDraggableEl : ->
		@view.$el.css {
			width: "#{@view.$el.width()}px"
			height: "#{@view.$el.height()}px"
		}

		Backbone.$('body').append @view.$el
		@view.$el.addClass 'bt-is-dragged'

	createPlaceholder : ->
		@placeHolder = new BackTree.Placeholder {
			replacedView : @view
		}
		@placeHolder.placeholderToEl()

	removePlaceholder : ->
		@placeHolder.elToPlaceholder()
		@placeHolder.remove()

	setOverlapped : ($el) ->
		if @$overlapped
			@$overlapped.removeClass 'overlapped'

		@$overlapped = $el
		if @$overlapped
			@$overlapped.addClass 'overlapped'

	saveModelPosition : ->
		model = @view.model
		result = @setModelPosition @view.model, @getModelPosition()

		if result
			@collection.trigger 'dndStructureChanged', model, result.oldPosition, result.newPosition

	setModelPosition : (model, newPosition) ->
		oldPosition =
			parent : model.parent()
			index : @getModelIndex(model)

		oldCId = if oldPosition.parent then oldPosition.parent.cid else null
		newCId = if newPosition.parent then newPosition.parent.cid else null

		if oldCId == newCId && oldPosition.index == newPosition.index
			return false

		oldCollection = model.collection
		newCollection = if newPosition.parent then newPosition.parent._nodes else @collection

		oldCollection.remove model
		newCollection.add model, {at:newPosition.index}

		if oldCId == newCId
			if newPosition.parent
				newPosition.parent.trigger 'childrenSorted', model, oldPosition, newPosition
		else
			if oldPosition.parent
				oldPosition.parent.trigger 'childrenChanged', model, oldPosition, newPosition

			if newPosition.parent
				newPosition.parent.trigger 'childrenChanged', model, oldPosition, newPosition
				newPosition.parent.set 'open', true

		return {
			oldPosition : oldPosition
			newPosition : newPosition
		}

	getModelPosition : ->
		$parent = @view.$el.parents('.bt-item:eq(0)')
		if !$parent.size()
			$parent = false

		position =
			parent : if $parent then $parent.data('view').model else null
			index : 0

		$siblings = @view.$el.parent().find('> .bt-item')
		position.index = $siblings.index @view.$el

		return position

	getModelIndex : (model) ->
		return model.collection.indexOf(model)

	remove : ->
		@view = null
		@$overlapped = null

		if @placeHolder
			@placeHolder.remove()
		@placeHolder = null

		Backbone.$(document).off 'mousemove.backTree mouseup.backTree'

		if @settings.get('touch')
			Backbone.$(document).off 'touchmove.backTree touchend.backTree touchcancel.backTree'

		return super