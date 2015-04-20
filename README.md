# backbone-tree-view
Backbone.View component which provide interactive tree.

Demo
----
[http://kirill-zhirnov.github.io/backbone-tree-view/](http://kirill-zhirnov.github.io/backbone-tree-view/)

How to install?
---------------

1. `npm install backbone-tree-view`
2. Add scripts and styles inside <head> tag:

```html
        <!--Dependencies: -->
        <link href="./node_modules/backbone-tree-view/node_modules/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
        <script src="./node_modules/backbone-tree-view/node_modules/jquery/dist/jquery.min.js"></script>
        <script src="./node_modules/backbone-tree-view/node_modules/underscore/underscore-min.js"></script>
        <script src="./node_modules/backbone-tree-view/node_modules/backbone/backbone.js"></script>
        <script src="./node_modules/backbone-tree-view/node_modules/backbone-tree-model/src/backbone.treemodel.js"></script>

        <!--Backbone-tree-view: -->
        <link href="./node_modules/backbone-tree-view/css/bootstrap-theme.min.css" rel="stylesheet">
        <script src="./node_modules/backbone-tree-view/lib/backbone-tree-view.js"></script>
```

3. Add container inside <body>:

```html
<body>
	<div id="tree"></div>
</body>
```

4. Prepare array for collection:

```javascript
	var data = [
	    {
	        id:7,
	        title:'No children'
	    },
	    {
	        id:1,
	        title:'Australia',
	        open : false,
	        nodes: [
	            {
	                id: 2,
	                title : 'Sydney'
	            }
	        ]
	    },
	];
```

Or you can create collection:

```javascript
	var data = new BackTree.Collection([
        {
            id:7,
            title:'No children'
        },
        {
            id:1,
            title:'Australia',
            open : false,
            nodes: [
                {
                    id: 2,
                    title : 'Sydney'
                }
            ]
        },
    ]);
```

5. Create tree:

```javascript
	var tree = new BackTree.Tree({
	    collection : data
	});
```

6. Render and append:

```javascript
	$('#tree').append(tree.render().$el);
```

Data structure:
---------------

```javascript
	var data = [
	    {
	        id:7,
	        title:'No children'
	    },
	    {
	        id:1,
	        title:'Australia',
	        open : true,
	        checked : true,
	        nodes: [
	            {
	                id: 2,
	                title : 'Sydney'
	            }
	        ]
	    },
	];
```

###Possible keys:

- nodes - (Array) - Array with children.

- open - (boolean) - If leaf has child - it will be opened.

- checked - (boolean) - If tree has checkboxes - checkbox will be checked.

Drag and drop
-------------

```javascript
	var tree = new BackTree.Tree({
	    collection : data,
	    settings : {
			plugins : {
                DnD: {}
            }
	    }
	});
```

###Possible options:

- changeParent - (boolean) - if false only sorting will be available.

Example:

```javascript
	var tree = new BackTree.Tree({
	    collection : data,
	    settings : {
			plugins : {
                DnD: {
                    changeParent : false
                }
            }
	    }
	});
```

How to serialize tree?
----------------------

```javascript
	var collection = new BackTree.Collection([
        {
            id:7,
            title:'No children'
        },
        {
            id:1,
            title:'Australia',
            open : false,
            nodes: [
                {
                    id: 2,
                    title : 'Sydney'
                }
            ]
        },
    ]);

	var tree = new BackTree.Tree({
	    collection : collection,
	    settings : {
			plugins : {
                DnD: {}
            }
	    }
	});

    console.log(collection.toJSON());
```

Checkboxes:
-----------

```javascript
	var tree = new BackTree.Tree({
	    collection : collection,
	    settings : {
			checkbox : true
	    }
	});
```

Get all checked:

```javascript
	collection.where({checked:true}, {deep:true});
```