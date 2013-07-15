///////////////////////////////////////
// Inheritance (by Douglas Crockford)

Function.prototype.method = function (name, func) {
   this.prototype[name] = func;
   return this;
}

Object.method('superior', function (name) {
   var that = this, method = that[name];
   return function ( ) {
      return method.apply(that, arguments);
   }
});

///////////////////////////////////////
// Phynix

// Imports
var   b2Vec2 = Box2D.Common.Math.b2Vec2
   ,  b2AABB = Box2D.Collision.b2AABB
   ,  b2BodyDef = Box2D.Dynamics.b2BodyDef
   ,  b2Body = Box2D.Dynamics.b2Body
   ,  b2FixtureDef = Box2D.Dynamics.b2FixtureDef
   ,  b2Fixture = Box2D.Dynamics.b2Fixture
   ,  b2World = Box2D.Dynamics.b2World
   ,  b2MassData = Box2D.Collision.Shapes.b2MassData
   ,  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
   ,  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
   ,  b2DebugDraw = Box2D.Dynamics.b2DebugDraw
   ,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
   ,  b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef
   ,  b2Mat22 = Box2D.Common.Math.b2Mat22
   ,  b2Transform = Box2D.Common.Math.b2Transform
   ;

// Draw scale
var PIXELS_TO_METER = 30.0;

var world = new b2World(
      new b2Vec2(0, 10)    //gravity
   ,  true                 //allow sleep
);

var blocks = {};
var commands = [''];
var command_index = 0;
var paused = false;

var block = function (spec, my) {
   var that = {};
   my = my || {};

   my.id = spec.id || ('block_'+(Object.keys(blocks).length + 1).toString());

   my.body = null;
   my.bodyDef = new b2BodyDef;
   my.bodyDef.type = spec.type || b2Body.b2_dynamicBody;
   my.fixtureDef = new b2FixtureDef;
   my.fixtureDef.filter.groupIndex = spec.collision || 0;
   my.fixtureDef.density = spec.density || 5.0;
   my.fixtureDef.restitution = spec.restitution || 0.45;
   my.fixtureDef.friction = spec.friction || 0.12;

   that.DYNAMIC = b2Body.b2_dynamicBody;
   that.STATIC = b2Body.b2_staticBody;

   that.getID = function ( ) {
      return spec.id;
   }

   that.getBodyDef = function ( ) {
      return my.bodyDef;
   }

   that.getFixtureDef = function ( ) {
      return my.fixtureDef;
   }

   that.getBody = function ( ) {
      return my.body;
   }

   that.setBody = function (b) {
      my.body = b;
   }

   that.getType = function ( ) {
      return my.bodyDef.type;
   }

   that.getDensity = function ( ) {
      return my.bodyDef.density;
   }

   that.getFriction = function ( ) {
      return my.bodyDef.friction;
   }

   return that;
};

var box = function(spec, my) {
   var that;
   my = my || {};

   that = block(spec, my);

   my.polygonShape = new b2PolygonShape;
   my.polygonShape.SetAsBox(spec.width / 2 / 30.0, spec.height / 2 / 30.0);
   my.fixtureDef.shape = my.polygonShape;

   that.getWidth = function ( ) {
      return spec.width;
   }

   that.getHeight = function ( ) {
      return spec.height;
   }

   return that;
};

var circle = function (spec, my) {
   var that;
   my = my || {};

   that = block(spec, my);

   my.circleShape = new b2CircleShape(spec.radius / 30.0);
   my.fixtureDef.shape = my.circleShape;

   that.getRadius = function ( ) {
      return spec.radius;
   }

   return that;
};

function createBlock(b, x, y, rotation) {
   b.getBodyDef().position.Set(x / 30.0, y / 30.0);

   b.setBody(world.CreateBody(b.getBodyDef()));
   b.getBody().CreateFixture(b.getFixtureDef());

   if (rotation)
   {
      var t = new b2Transform(b.getBody().GetPosition(), b2Mat22.FromAngle(rotation * (Math.PI / 180)));
      b.getBody().SetTransform(t);
   }

   blocks[b.getID()] = b;
};

function mkbox(x, y, w, h, rotation, identifier) {
   var b = box({id: identifier, width: w, height: h});

   createBlock(b, x, y, rotation);
}

function mkcir(x, y, r, identifier) {
   var c = circle({id: identifier, radius: r});

   createBlock(c, x, y);
}

function mkjnt(id1, id2) {
   var block1 = blocks[id1],
       block2 = blocks[id2];

   var distanceJointDef = new b2DistanceJointDef;
   distanceJointDef.Initialize(block1.getBody(), block2.getBody(), block1.getBody().GetWorldCenter(), block2.getBody().GetWorldCenter());

   world.CreateJoint(distanceJointDef);
}

function pause( ) {
	paused = !paused;
}

function inputKeyPressed(e) {
   var commandInput = document.getElementById("commandInput");
   var command = commandInput.value;

   if (e.keyCode == 13) { // Enter
      if (command != '') {
      	commands.splice(1, 0, command);
      	command_index = 0;
      	commandInput.value = '';
      	console.log('> ' + command);

      	eval(command);
      }

      console.log(commands);
   }

   if (e.keyCode == 38) { // Up arrow
      if (command_index + 1 < commands.length) {
         command_index++;
      }
   }

   if (e.keyCode == 40) { // Down arrow
   	  if (command_index - 1 >= 0) {
         command_index--;
      }
   }

   if (e.keyCode == 38 || e.keyCode == 40) {
      commandInput.value = commands[command_index];
   }
}

///////////////////////////////////////
// Box2D

function init() {
   
   var fixDef = new b2FixtureDef;
   fixDef.density = 1.0;
   fixDef.friction = 0.5;
   fixDef.restitution = 0.2;
   
   var bodyDef = new b2BodyDef;
   
   //create ground
   bodyDef.type = b2Body.b2_staticBody;
   fixDef.shape = new b2PolygonShape;
   fixDef.shape.SetAsBox(20, 2);
   bodyDef.position.Set(10, 400 / 30 + 1.8);
   world.CreateBody(bodyDef).CreateFixture(fixDef);
   bodyDef.position.Set(10, -1.8);
   world.CreateBody(bodyDef).CreateFixture(fixDef);
   fixDef.shape.SetAsBox(2, 14);
   bodyDef.position.Set(-1.8, 13);
   world.CreateBody(bodyDef).CreateFixture(fixDef);
   bodyDef.position.Set(21.8, 13);
   world.CreateBody(bodyDef).CreateFixture(fixDef);
   
   //setup debug draw
   var debugDraw = new b2DebugDraw();
   debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
   debugDraw.SetDrawScale(30.0);
   debugDraw.SetFillAlpha(0.5);
   debugDraw.SetLineThickness(1.0);
   debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
   world.SetDebugDraw(debugDraw);
   
   window.setInterval(update, 1000 / 60);
   
   //mouse
   
   var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
   var canvasPosition = getElementPosition(document.getElementById("canvas"));
   
   document.addEventListener("mousedown", function(e) {
      isMouseDown = true;
      handleMouseMove(e);
      document.addEventListener("mousemove", handleMouseMove, true);
   }, true);
   
   document.addEventListener("mouseup", function() {
      document.removeEventListener("mousemove", handleMouseMove, true);
      isMouseDown = false;
      mouseX = undefined;
      mouseY = undefined;
   }, true);
   
   function handleMouseMove(e) {
      mouseX = (e.clientX - canvasPosition.x) / 30;
      mouseY = (e.clientY - canvasPosition.y) / 30;
   }
   
   function getBodyAtMouse() {
      mousePVec = new b2Vec2(mouseX, mouseY);
      var aabb = new b2AABB();
      aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
      aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
      
      // Query the world for overlapping shapes.

      selectedBody = null;
      world.QueryAABB(getBodyCB, aabb);
      return selectedBody;
   }

   function getBodyCB(fixture) {
      if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
         if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
            selectedBody = fixture.GetBody();
            return false;
         }
      }
      return true;
   }
   
   //update
   
   function update() {
   		if (!paused) {
	      if(isMouseDown && (!mouseJoint)) {
	         var body = getBodyAtMouse();
	         if(body) {
	            var md = new b2MouseJointDef();
	            md.bodyA = world.GetGroundBody();
	            md.bodyB = body;
	            md.target.Set(mouseX, mouseY);
	            md.collideConnected = true;
	            md.maxForce = 300.0 * body.GetMass();
	            mouseJoint = world.CreateJoint(md);
	            body.SetAwake(true);
	         }
	      }
	      
	      if(mouseJoint) {
	         if(isMouseDown) {
	            mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
	         } else {
	            world.DestroyJoint(mouseJoint);
	            mouseJoint = null;
	         }
	      }
	   
	      world.Step(1 / 60, 10, 10);
	      world.ClearForces();
  		}
  		world.DrawDebugData();
   }
   
   //helpers
   
   //http://js-tut.aardon.de/js-tut/tutorial/position.html
   function getElementPosition(element) {
      var elem=element, tagname="", x=0, y=0;
     
      while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
         y += elem.offsetTop;
         x += elem.offsetLeft;
         tagname = elem.tagName.toUpperCase();

         if(tagname == "BODY")
            elem=0;

         if(typeof(elem) == "object") {
            if(typeof(elem.offsetParent) == "object")
               elem = elem.offsetParent;
         }
      }

      return {x: x, y: y};
   }
}