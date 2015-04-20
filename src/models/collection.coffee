class BackTree.Collection extends Backbone.TreeCollection
	model: BackTree.Model

BackTree.Model.prototype.collectionConstructor = BackTree.Collection