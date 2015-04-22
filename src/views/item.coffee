class BackTree.Item extends BackTree.View
	tagName : 'li'

	className : 'bt-item'

	initialize : ->
		@childList = null

		@listenTo @model, 'childrenChanged', @onChildrenChanged
		@listenTo @model, 'change:open', @onOpenChanged
		@listenTo @model, 'change:checked', @onCheckedChanged

		@$el.data 'view', @

	events : ->
		return {
			"click > .wrapper .toggle": "onToggleClick"
			"mousedown > .wrapper": "onMouseDown"
			"touchstart > .wrapper": "onTouchStart"
			'click > .wrapper input[name="checkbox"]': "onCheckboxClicked"
			"dragstart": (e) ->
				e.preventDefault()
			"click > .wrapper .right-part .btn" : "onUserButtonClicked"
		}

	render : ->
		@$el.html @getTpl()

		if @model.hasChildren()
			if @model.get('open')
				@renderChildList()
				@childList.open(false)

		@setupClassNames()

		return @

	getTpl : () ->
		checkbox = ''

		if @settings.get('checkbox')
			checked = if @model.get('checked') then 'checked="checked"' else ''
			checkbox = """
<input type="checkbox" name="checkbox" value="" #{checked} />
"""

		return """
<div class="wrapper clearfix">
	<div class="left-part no-dnd">
		#{checkbox}
		<a class="toggle btn" href="#">
			<span></span>
		</a>
	</div>
	<div class="body-part">#{@getBodyPart()}</div>
	<div class="right-part no-dnd">#{@getRightPart()}</div>
</div>
"""

	getBodyPart : () ->
		return @model.getTitle()

	getRightPart : () ->
		return ''

#		return """
#<a href="#" class="btn btn-danger btn-xs">X</a>
#"""

	setupClassNames : () ->
		classes = []

		if @model.hasChildren()
			classes.push 'has-child'

			if @model.get('open')
				classes.push 'open'
		else
			classes.push 'empty'

		@$el.addClass classes.join(' ')

	resetClassNames : () ->
		@$el.removeClass 'open empty has-child'

	renderChildList : ->
		@childList = new BackTree.List {
			collection : @model._nodes
			settings : @settings
		}
		@$el.append @childList.render().$el

	onToggleClick : (e) ->
		e.preventDefault()

		if !@model.hasChildren()
			return

		@model.set 'open', !@model.get('open')

	onOpenChanged : ->
		if @model.get 'open'
			if !@childList
				@renderChildList()

			@childList.open()
		else
			@childList.close()

		@resetClassNames()
		@setupClassNames()

	onChildrenChanged : ->
		@resetClassNames()
		@setupClassNames()

	onMouseDown : (e) ->
		@model.root().trigger 'dragStart', @, e

	onTouchStart : (e) ->
		if !@settings.get('touch')
			return

		@model.root().trigger 'dragStart', @, e

	onCheckboxClicked : (e) ->
		$checkbox = @$el.find('input[name="checkbox"]')
		@model.set 'checked', $checkbox.prop('checked')
		@model.root().trigger 'checkboxChanged', e, @

	onCheckedChanged : ->
		$checkbox = @$el.find('input[name="checkbox"]')
		$checkbox.prop 'checked', @model.get('checked')

	onUserButtonClicked : (e) ->
		@model.root().trigger 'userButtonClicked', e, @

	remove : ->
		@$el.data 'view', null

		if @childList
			@childList.remove()
			@childList = null

		return super