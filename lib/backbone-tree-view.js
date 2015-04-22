(function (root, factory) {

  if (typeof define === "function" && define.amd) {
    // AMD (+ global for extensions)
    define(["underscore", "backbone", "backbone-tree-model"], function (_, Backbone) {
      return (root.BackTree = factory(_, Backbone));
    });
  } else if (typeof exports === "object") {
    // CommonJS
    module.exports = factory(require("underscore"), require("backbone"), require("backbone-tree-model"));
  } else {
    // Browser
    root.BackTree = factory(root._, root.Backbone);
  }}(this, function (_, Backbone) {

  "use strict";

var BackTree,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BackTree = {
  plugins: {}
};

BackTree.Model = (function(superClass) {
  extend(Model, superClass);

  function Model() {
    return Model.__super__.constructor.apply(this, arguments);
  }

  Model.prototype.defaults = {
    open: false
  };

  Model.prototype.getTitle = function() {
    return this.get('title');
  };

  Model.prototype.hasChildren = function() {
    return !!this.nodes();
  };

  return Model;

})(Backbone.TreeModel);

BackTree.Collection = (function(superClass) {
  extend(Collection, superClass);

  function Collection() {
    return Collection.__super__.constructor.apply(this, arguments);
  }

  Collection.prototype.model = BackTree.Model;

  Collection.prototype.getStates = function(attrs) {
    var out;
    if (attrs == null) {
      attrs = ['open', 'checked'];
    }
    out = {};
    this.each(function(model) {
      out[model.id] = _.pick(model.attributes, attrs);
      if (model.nodes()) {
        return _.extend(out, model.nodes().getStates(attrs));
      }
    });
    return out;
  };

  Collection.prototype.setStates = function(states) {
    return this.each(function(model) {
      if (states[model.id]) {
        model.set(states[model.id]);
      }
      if (model.nodes()) {
        return model.nodes().setStates(states);
      }
    });
  };

  return Collection;

})(Backbone.TreeCollection);

BackTree.Model.prototype.collectionConstructor = BackTree.Collection;

BackTree.View = (function(superClass) {
  extend(View, superClass);

  function View(options) {
    _.extend(this, _.pick(options, ['settings']));
    if (!(this.settings instanceof BackTree.Settings)) {
      this.settings = new BackTree.Settings(this.settings);
    }
    View.__super__.constructor.apply(this, arguments);
  }

  View.prototype.remove = function() {
    this.settings = null;
    this.model = null;
    this.collection = null;
    return View.__super__.remove.apply(this, arguments);
  };

  return View;

})(Backbone.View);

BackTree.Tree = (function(superClass) {
  extend(Tree, superClass);

  function Tree() {
    return Tree.__super__.constructor.apply(this, arguments);
  }

  Tree.prototype.className = 'bt-bootstrap';

  Tree.prototype.initialize = function() {
    this.child = null;
    this.plugins = [];
    this.settings.set('$root', this.$el);
    if (_.isArray(this.collection)) {
      this.collection = new BackTree.Collection(this.collection);
    }
    if (!this.collection || !(this.collection instanceof BackTree.Collection)) {
      throw new Error('You must specify @collection and it should be instance of BackTree.Collection.');
    }
    return this.initPlugins();
  };

  Tree.prototype.initPlugins = function() {
    return _.each(this.settings.get('plugins'), (function(_this) {
      return function(options, plugin) {
        return _this.plugins.push(new BackTree.plugins[plugin](_.extend({
          collection: _this.collection,
          settings: _this.settings
        }, options)));
      };
    })(this));
  };

  Tree.prototype.render = function() {
    this.child = new BackTree.List({
      collection: this.collection,
      settings: this.settings,
      className: 'bt-root'
    });
    this.$el.append(this.child.render().$el);
    return this;
  };

  Tree.prototype.remove = function() {
    if (this.child) {
      this.child.remove();
    }
    this.child = null;
    _.each(this.plugins, function(plugin, key) {
      return plugin.remove();
    });
    this.plugins = [];
    this.settings.set('$root', null);
    return Tree.__super__.remove.apply(this, arguments);
  };

  return Tree;

})(BackTree.View);

BackTree.Item = (function(superClass) {
  extend(Item, superClass);

  function Item() {
    return Item.__super__.constructor.apply(this, arguments);
  }

  Item.prototype.tagName = 'li';

  Item.prototype.className = 'bt-item';

  Item.prototype.initialize = function() {
    this.childList = null;
    this.listenTo(this.model, 'childrenChanged', this.onChildrenChanged);
    this.listenTo(this.model, 'change:open', this.onOpenChanged);
    this.listenTo(this.model, 'change:checked', this.onCheckedChanged);
    return this.$el.data('view', this);
  };

  Item.prototype.events = function() {
    return {
      "click > .wrapper .toggle": "onToggleClick",
      "mousedown > .wrapper": "onMouseDown",
      "touchstart > .wrapper": "onTouchStart",
      'click > .wrapper input[name="checkbox"]': "onCheckboxClicked",
      "dragstart": function(e) {
        return e.preventDefault();
      },
      "click > .wrapper .right-part .btn": "onUserButtonClicked"
    };
  };

  Item.prototype.render = function() {
    this.$el.html(this.getTpl());
    if (this.model.hasChildren()) {
      if (this.model.get('open')) {
        this.renderChildList();
        this.childList.open(false);
      }
    }
    this.setupClassNames();
    return this;
  };

  Item.prototype.getTpl = function() {
    var checkbox, checked;
    checkbox = '';
    if (this.settings.get('checkbox')) {
      checked = this.model.get('checked') ? 'checked="checked"' : '';
      checkbox = "<input type=\"checkbox\" name=\"checkbox\" value=\"\" " + checked + " />";
    }
    return "<div class=\"wrapper clearfix\">\n	<div class=\"left-part no-dnd\">\n		" + checkbox + "\n		<a class=\"toggle btn\" href=\"#\">\n			<span></span>\n		</a>\n	</div>\n	<div class=\"body-part\">" + (this.getBodyPart()) + "</div>\n	<div class=\"right-part no-dnd\">" + (this.getRightPart()) + "</div>\n</div>";
  };

  Item.prototype.getBodyPart = function() {
    return this.model.getTitle();
  };

  Item.prototype.getRightPart = function() {
    return '';
  };

  Item.prototype.setupClassNames = function() {
    var classes;
    classes = [];
    if (this.model.hasChildren()) {
      classes.push('has-child');
      if (this.model.get('open')) {
        classes.push('open');
      }
    } else {
      classes.push('empty');
    }
    return this.$el.addClass(classes.join(' '));
  };

  Item.prototype.resetClassNames = function() {
    return this.$el.removeClass('open empty has-child');
  };

  Item.prototype.renderChildList = function() {
    this.childList = new BackTree.List({
      collection: this.model._nodes,
      settings: this.settings
    });
    return this.$el.append(this.childList.render().$el);
  };

  Item.prototype.onToggleClick = function(e) {
    e.preventDefault();
    if (!this.model.hasChildren()) {
      return;
    }
    return this.model.set('open', !this.model.get('open'));
  };

  Item.prototype.onOpenChanged = function() {
    if (this.model.get('open')) {
      if (!this.childList) {
        this.renderChildList();
      }
      this.childList.open();
    } else {
      this.childList.close();
    }
    this.resetClassNames();
    return this.setupClassNames();
  };

  Item.prototype.onChildrenChanged = function() {
    this.resetClassNames();
    return this.setupClassNames();
  };

  Item.prototype.onMouseDown = function(e) {
    return this.model.root().trigger('dragStart', this, e);
  };

  Item.prototype.onTouchStart = function(e) {
    if (!this.settings.get('touch')) {
      return;
    }
    return this.model.root().trigger('dragStart', this, e);
  };

  Item.prototype.onCheckboxClicked = function(e) {
    var $checkbox;
    $checkbox = this.$el.find('input[name="checkbox"]');
    this.model.set('checked', $checkbox.prop('checked'));
    return this.model.root().trigger('checkboxChanged', e, this);
  };

  Item.prototype.onCheckedChanged = function() {
    var $checkbox;
    $checkbox = this.$el.find('input[name="checkbox"]');
    return $checkbox.prop('checked', this.model.get('checked'));
  };

  Item.prototype.onUserButtonClicked = function(e) {
    return this.model.root().trigger('userButtonClicked', e, this);
  };

  Item.prototype.remove = function() {
    this.$el.data('view', null);
    if (this.childList) {
      this.childList.remove();
      this.childList = null;
    }
    return Item.__super__.remove.apply(this, arguments);
  };

  return Item;

})(BackTree.View);

BackTree.List = (function(superClass) {
  extend(List, superClass);

  function List() {
    return List.__super__.constructor.apply(this, arguments);
  }

  List.prototype.tagName = 'ul';

  List.prototype.initialize = function() {
    this.initItemsView();
    this.listenTo(this.collection, 'remove', this.onModelRemove);
    this.listenTo(this.collection, 'add', this.onModelAdd);
    return this.listenTo(this.collection, 'reset', this.onCollectionReset);
  };

  List.prototype.initItemsView = function() {
    this.children = {};
    return this.collection.forEach((function(_this) {
      return function(model) {
        return _this.children[model.cid] = _this.settings.makeItem({
          model: model
        });
      };
    })(this));
  };

  List.prototype.render = function() {
    _.each(this.children, (function(_this) {
      return function(child) {
        return _this.$el.append(child.render().$el);
      };
    })(this));
    return this;
  };

  List.prototype.open = function(animation) {
    if (animation == null) {
      animation = true;
    }
    if (animation && this.settings.get('animation')) {
      return this.$el.slideDown(200);
    } else {
      return this.$el.show();
    }
  };

  List.prototype.close = function(animation) {
    if (animation == null) {
      animation = true;
    }
    if (animation && this.settings.get('animation')) {
      return this.$el.slideUp(200);
    } else {
      return this.$el.hide();
    }
  };

  List.prototype.onModelRemove = function(model) {
    this.children[model.cid].remove();
    return delete this.children[model.cid];
  };

  List.prototype.onModelAdd = function(model) {
    var $prev, child, index;
    index = this.collection.indexOf(model);
    child = this.settings.makeItem({
      model: model
    });
    child.render();
    if (index === 0) {
      this.$el.prepend(child.$el);
    } else {
      $prev = this.$("> .bt-item:eq(" + (index - 1) + ")");
      if (!$prev.size()) {
        throw new Error("Previous el not found!");
      }
      child.$el.insertAfter($prev);
    }
    return this.children[model.cid] = child;
  };

  List.prototype.onCollectionReset = function() {
    _.each(this.children, (function(_this) {
      return function(child, key) {
        return child.remove();
      };
    })(this));
    this.initItemsView();
    return this.render();
  };

  List.prototype.remove = function() {
    _.each(this.children, function(child, key) {
      return child.remove();
    });
    this.children = {};
    return List.__super__.remove.apply(this, arguments);
  };

  return List;

})(BackTree.View);

BackTree.Placeholder = (function(superClass) {
  extend(Placeholder, superClass);

  function Placeholder() {
    return Placeholder.__super__.constructor.apply(this, arguments);
  }

  Placeholder.prototype.tagName = 'li';

  Placeholder.prototype.className = 'bt-item placeholder';

  Placeholder.prototype.initialize = function(options) {
    return _.extend(this, _.pick(options, ['replacedView']));
  };

  Placeholder.prototype.placeholderToEl = function() {
    this.$el.css({
      width: (this.replacedView.$el.outerWidth()) + "px",
      height: (this.replacedView.$el.outerHeight()) + "px"
    });
    return this.replace(this.replacedView.$el, this.$el);
  };

  Placeholder.prototype.elToPlaceholder = function() {
    return this.replace(this.$el, this.replacedView.$el);
  };

  Placeholder.prototype.replace = function(from, to) {
    var prev;
    prev = from.prev();
    if (prev.size() > 0) {
      return to.insertAfter(prev);
    } else {
      return from.parent().prepend(to);
    }
  };

  Placeholder.prototype.remove = function() {
    this.replacedView = null;
    return Placeholder.__super__.remove.apply(this, arguments);
  };

  return Placeholder;

})(BackTree.View);

BackTree.Settings = (function(superClass) {
  extend(Settings, superClass);

  function Settings() {
    return Settings.__super__.constructor.apply(this, arguments);
  }

  Settings.prototype.defaults = {
    animation: true,
    $root: null,
    plugins: [],
    dndSkipMove: ['.btn', '.no-dnd'],
    ItemConstructor: BackTree.Item,
    ListConstructor: BackTree.List,
    touch: true,
    checkbox: false
  };

  Settings.prototype.makeItem = function(options) {
    var Constructor;
    if (options == null) {
      options = {};
    }
    _.extend(options, {
      settings: this
    });
    Constructor = this.get('ItemConstructor');
    return new Constructor(options);
  };

  return Settings;

})(Backbone.Model);

BackTree.plugins.Basic = (function() {
  function Basic(options) {
    _.extend(this, _.pick(options, ['collection', 'settings']));
    this.initialize.apply(this, arguments);
  }

  Basic.prototype.initialize = function() {};

  Basic.prototype.remove = function() {
    this.stopListening();
    this.collection = null;
    this.settings = null;
    return this;
  };

  return Basic;

})();

_.extend(BackTree.plugins.Basic.prototype, Backbone.Events);

BackTree.plugins.DnD = (function(superClass) {
  extend(DnD, superClass);

  function DnD() {
    return DnD.__super__.constructor.apply(this, arguments);
  }

  DnD.prototype.initialize = function(options) {
    this.view = null;
    this.lastMousePosition = null;
    this.movementDirection = null;
    this.$overlapped = null;
    this.placeHolder = null;
    this.shift = {
      x: 0,
      y: 0
    };
    this.listenTo(this.collection, 'dragStart', this.dragStart);
    Backbone.$(document).on('mousemove.backTree', Backbone.$.proxy(this.drag, this));
    Backbone.$(document).on('mouseup.backTree', Backbone.$.proxy(this.dragEnd, this));
    if (this.settings.get('touch')) {
      Backbone.$(document).on('touchmove.backTree', Backbone.$.proxy(this.drag, this));
      Backbone.$(document).on('touchend.backTree touchcancel.backTree', Backbone.$.proxy(this.dragEnd, this));
    }
    this.settings.get('$root').addClass('dnd');
    _.extend(this, _.pick(options, ['changeParent']));
    return _.defaults(this, {
      changeParent: true
    });
  };

  DnD.prototype.dragStart = function(view, e) {
    var $target, offset, skip, xy;
    $target = Backbone.$(e.target);
    skip = false;
    $.merge($target, $target.parentsUntil('.bt-item')).each((function(_this) {
      return function(key, el) {
        var $el;
        $el = Backbone.$(el);
        return _.each(_this.settings.get('dndSkipMove'), function(selector) {
          if ($el.is(selector)) {
            return skip = true;
          }
        });
      };
    })(this));
    if (skip) {
      return;
    }
    e.preventDefault();
    if (!$target.hasClass('bt-item')) {
      $target = $target.parents('.bt-item:eq(0)');
    }
    if (view.el !== $target.get(0)) {
      return;
    }
    xy = this.getXY(e);
    this.view = view;
    offset = this.view.$el.offset();
    this.shift.x = xy.x - offset.left;
    this.shift.y = xy.y - offset.top;
    this.createPlaceholder();
    this.prepareDraggableEl();
    this.lastMousePosition = null;
    return this.moveAt(e);
  };

  DnD.prototype.dragEnd = function(e) {
    if (!this.view) {
      return;
    }
    this.setOverlapped(null);
    this.removePlaceholder();
    this.view.$el.removeClass('bt-is-dragged');
    this.view.$el.css({
      left: '',
      top: '',
      display: '',
      width: '',
      height: ''
    });
    this.saveModelPosition();
    return this.view = null;
  };

  DnD.prototype.drag = function(e) {
    if (!this.view) {
      return;
    }
    this.moveAt(e);
    return this.dragOver(e);
  };

  DnD.prototype.getXY = function(e) {
    var touch, x, y;
    if (_.indexOf(['touchstart', 'touchmove'], e.type) !== -1 && (touch = e.originalEvent.targetTouches[0])) {
      x = touch.pageX;
      y = touch.pageY;
    } else {
      x = e.pageX;
      y = e.pageY;
    }
    return {
      x: x,
      y: y
    };
  };

  DnD.prototype.dragOver = function(e) {
    var overlapped;
    overlapped = this.getOverlap(e);
    this.setOverlapped(overlapped.$el);
    if (!this.$overlapped) {
      return;
    }
    if (this.$overlapped.hasClass('placeholder')) {
      return this.dragOverPlaceholder(overlapped);
    } else {
      return this.dragOverItem(overlapped);
    }
  };

  DnD.prototype.dragOverItem = function(overlapped) {
    var $upper, next;
    if (this.changeParent && this.shallAddAsChild(this.$overlapped, overlapped.coef)) {
      return this.addAsChild(this.$overlapped);
    } else if (this.changeParent && ($upper = this.shallLevelUp(overlapped.coef))) {
      return this.placeHolder.$el.insertAfter($upper);
    } else if (this.movementDirection !== 'eq') {
      if (!this.changeParent && this.$overlapped.parent().get(0) !== this.placeHolder.$el.parent().get(0)) {
        return;
      }
      next = overlapped.coef.vertical > 50;
      if (overlapped.direction === 'topLeft' || overlapped.direction === 'topRight') {
        next = !next;
      }
      if (next) {
        return this.placeHolder.$el.insertAfter(this.$overlapped);
      } else {
        return this.placeHolder.$el.insertBefore(this.$overlapped);
      }
    }
  };

  DnD.prototype.dragOverPlaceholder = function(overlapped) {
    var $parent, $upper, view;
    if (!this.changeParent) {
      return;
    }
    $upper = this.shallLevelUp(overlapped.coef);
    if ($upper) {
      view = $upper.data('view');
      this.placeHolder.$el.insertAfter($upper);
      return;
    }
    $parent = this.shallLevelDown(overlapped.coef);
    if ($parent) {
      this.addAsChild($parent, 'append');
    }
  };

  DnD.prototype.getOverlap = function(e) {
    var elRectangle, els, height, max, offset, points, width;
    offset = this.view.$el.offset();
    width = this.view.$el.outerWidth();
    height = this.view.$el.outerHeight();
    elRectangle = [[offset.left, offset.top], [offset.left + width, offset.top + height]];
    points = {
      topLeft: [offset.left, offset.top],
      topRight: [offset.left + width, offset.top],
      bottomLeft: [offset.left, offset.top + height],
      bottomRight: [offset.left + width, offset.top + height]
    };
    this.view.$el.hide();
    els = {};
    _.each(points, function(point, key) {
      var x, y;
      x = point[0] - $(window).scrollLeft();
      y = point[1] - $(window).scrollTop();
      return els[key] = document.elementFromPoint(x, y);
    });
    this.view.$el.show();
    max = {
      coef: 0,
      key: null
    };
    _.each(els, (function(_this) {
      return function(el, key) {
        var $el;
        $el = _this.getOverlappedEl(el);
        if (!$el) {
          return;
        }
        els[key] = {
          $el: $el,
          coef: _this.calcOverlapCoefficient($el, points[key], key, elRectangle)
        };
        if (els[key].coef.overlap > max.coef) {
          max.coef = els[key].coef.overlap;
          return max.key = key;
        }
      };
    })(this));
    if (!max.key) {
      return {
        $el: false
      };
    }
    return {
      $el: els[max.key].$el,
      point: points[max.key],
      direction: max.key,
      coef: els[max.key].coef
    };
  };

  DnD.prototype.calcOverlapCoefficient = function($overlappedEl, point, direction, elRectangle) {
    var $el, height, offset, overlappedLeftWidth, overlappedRectangle, width, xOverlap, yOverlap;
    if ($overlappedEl.hasClass('placeholder')) {
      $el = $overlappedEl;
    } else {
      $el = $overlappedEl.find('> .wrapper');
    }
    offset = $el.offset();
    width = $el.outerWidth();
    height = $el.outerHeight();
    overlappedRectangle = [[offset.left, offset.top], [offset.left + width, offset.top + height]];
    overlappedLeftWidth = elRectangle[0][0] - overlappedRectangle[0][0];
    xOverlap = Math.max(0, Math.min(elRectangle[1][0], overlappedRectangle[1][0]) - Math.max(elRectangle[0][0], overlappedRectangle[0][0]));
    yOverlap = Math.max(0, Math.min(elRectangle[1][1], overlappedRectangle[1][1]) - Math.max(elRectangle[0][1], overlappedRectangle[0][1]));
    return {
      vertical: Math.round(yOverlap / height * 100),
      leftMargin: overlappedLeftWidth,
      overlap: xOverlap * yOverlap
    };
  };

  DnD.prototype.getOverlappedEl = function(el) {
    var $el;
    if (!Backbone.$.contains(this.settings.get('$root').get(0), el)) {
      return false;
    }
    $el = Backbone.$(el);
    if ($el.hasClass('placeholder') && $el.hasClass('bt-item')) {
      return $el;
    }
    if (!this.doesElHaveView($el)) {
      $el = $el.parents('.bt-item:eq(0)');
      if ($el.size() !== 1 || !this.doesElHaveView($el)) {
        $el = false;
      }
    }
    return $el;
  };

  DnD.prototype.doesElHaveView = function($target) {
    if ($target.data('view') && $target.data('view') instanceof BackTree.Item) {
      return true;
    }
    return false;
  };

  DnD.prototype.addAsChild = function($el, mode) {
    var view;
    if (mode == null) {
      mode = 'prepend';
    }
    view = $el.data('view');
    if (!view.childList) {
      view.renderChildList();
      view.childList.open(false);
      $el.data('view').model.set('open', true);
    }
    return view.childList.$el[mode](this.placeHolder.$el);
  };

  DnD.prototype.shallLevelDown = function(coefficient) {
    var $prev, view;
    $prev = this.$overlapped.prev('.bt-item:eq(0)');
    if ($prev.size() && this.doesElHaveView($prev) && coefficient.leftMargin > 30) {
      view = $prev.data('view');
      if ((view.model.hasChildren() && view.model.get('open')) || !view.model.hasChildren()) {
        if (!view.childList) {
          view.renderChildList();
          view.childList.open(false);
        }
        return $prev;
      }
    }
    return false;
  };

  DnD.prototype.shallLevelUp = function(coefficient) {
    var $children, $parent;
    if (coefficient.leftMargin < -30) {
      $parent = this.$overlapped.parents('.bt-item:eq(0)');
      if ($parent.size() && this.doesElHaveView($parent)) {
        $children = $parent.find('> ul > .bt-item');
        if ($children.size() > 0 && $children.index(this.$overlapped) === ($children.size() - 1)) {
          return $parent;
        }
      }
    }
    return false;
  };

  DnD.prototype.shallAddAsChild = function($el, coefficient) {
    var shall, view;
    view = $el.data('view');
    shall = coefficient.leftMargin > 30;
    if (shall) {
      if (view.model.hasChildren() && !view.model.get('open')) {
        view.model.set('open', true);
        return false;
      }
      if (!view.childList) {
        view.renderChildList();
        view.childList.open(false);
      }
    }
    return shall;
  };

  DnD.prototype.moveAt = function(e) {
    var left, top, xy;
    xy = this.getXY(e);
    left = xy.x - this.shift.x;
    top = xy.y - this.shift.y;
    this.view.$el.css({
      left: left + "px",
      top: top + "px"
    });
    this.movementDirection = null;
    if (this.lastMousePosition) {
      if (this.lastMousePosition.y > xy.y) {
        this.movementDirection = 'up';
      } else if (this.lastMousePosition.y < xy.y) {
        this.movementDirection = 'down';
      } else {
        this.movementDirection = 'eq';
      }
    }
    return this.lastMousePosition = xy;
  };

  DnD.prototype.prepareDraggableEl = function() {
    this.view.$el.css({
      width: (this.view.$el.width()) + "px",
      height: (this.view.$el.height()) + "px"
    });
    Backbone.$('body').append(this.view.$el);
    return this.view.$el.addClass('bt-is-dragged');
  };

  DnD.prototype.createPlaceholder = function() {
    this.placeHolder = new BackTree.Placeholder({
      replacedView: this.view
    });
    return this.placeHolder.placeholderToEl();
  };

  DnD.prototype.removePlaceholder = function() {
    this.placeHolder.elToPlaceholder();
    return this.placeHolder.remove();
  };

  DnD.prototype.setOverlapped = function($el) {
    if (this.$overlapped) {
      this.$overlapped.removeClass('overlapped');
    }
    this.$overlapped = $el;
    if (this.$overlapped) {
      return this.$overlapped.addClass('overlapped');
    }
  };

  DnD.prototype.saveModelPosition = function() {
    var model, result;
    model = this.view.model;
    result = this.setModelPosition(this.view.model, this.getModelPosition());
    if (result) {
      return this.collection.trigger('dndStructureChanged', model, result.oldPosition, result.newPosition);
    }
  };

  DnD.prototype.setModelPosition = function(model, newPosition) {
    var newCId, newCollection, oldCId, oldCollection, oldPosition;
    oldPosition = {
      parent: model.parent(),
      index: this.getModelIndex(model)
    };
    oldCId = oldPosition.parent ? oldPosition.parent.cid : null;
    newCId = newPosition.parent ? newPosition.parent.cid : null;
    if (oldCId === newCId && oldPosition.index === newPosition.index) {
      return false;
    }
    oldCollection = model.collection;
    newCollection = newPosition.parent ? newPosition.parent._nodes : this.collection;
    oldCollection.remove(model);
    newCollection.add(model, {
      at: newPosition.index
    });
    if (oldCId === newCId) {
      if (newPosition.parent) {
        newPosition.parent.trigger('childrenSorted', model, oldPosition, newPosition);
      }
    } else {
      if (oldPosition.parent) {
        oldPosition.parent.trigger('childrenChanged', model, oldPosition, newPosition);
      }
      if (newPosition.parent) {
        newPosition.parent.trigger('childrenChanged', model, oldPosition, newPosition);
        newPosition.parent.set('open', true);
      }
    }
    return {
      oldPosition: oldPosition,
      newPosition: newPosition
    };
  };

  DnD.prototype.getModelPosition = function() {
    var $parent, $siblings, position;
    $parent = this.view.$el.parents('.bt-item:eq(0)');
    if (!$parent.size()) {
      $parent = false;
    }
    position = {
      parent: $parent ? $parent.data('view').model : null,
      index: 0
    };
    $siblings = this.view.$el.parent().find('> .bt-item');
    position.index = $siblings.index(this.view.$el);
    return position;
  };

  DnD.prototype.getModelIndex = function(model) {
    return model.collection.indexOf(model);
  };

  DnD.prototype.remove = function() {
    this.view = null;
    this.$overlapped = null;
    if (this.placeHolder) {
      this.placeHolder.remove();
    }
    this.placeHolder = null;
    Backbone.$(document).off('mousemove.backTree mouseup.backTree');
    if (this.settings.get('touch')) {
      Backbone.$(document).off('touchmove.backTree touchend.backTree touchcancel.backTree');
    }
    return DnD.__super__.remove.apply(this, arguments);
  };

  return DnD;

})(BackTree.plugins.Basic);
  return BackTree;
}));