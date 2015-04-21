class BackTree.Collection extends Backbone.TreeCollection
	model: BackTree.Model

	getStates : (attrs = ['open', 'checked']) ->
		out = {}
		@each (model) ->
			out[model.id] = _.pick model.attributes, attrs

			if model.nodes()
				_.extend out, model.nodes().getStates(attrs)

		return out

	setStates : (states) ->
		@each (model) ->
			if states[model.id]
				model.set states[model.id]

			if model.nodes()
				model.nodes().setStates states

BackTree.Model.prototype.collectionConstructor = BackTree.Collection