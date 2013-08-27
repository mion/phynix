/*
 *  Phynix - Create physical simulations with Unix-like commands.
 *  - Thanks to the Box2D port from Flash to JS: box2dweb (http://code.google.com/p/box2dweb/)
 *  - And the original Box2D (http://box2d.org/) physics engine was developed by Erin Catto
 *
 *  - By Gabriel Vieira (https://github.com/mion)
 */

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

// Box2D imports
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

// http://js-tut.aardon.de/js-tut/tutorial/position.html
var getElementPosition = function(element) {
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
};

// Box2D wrapper classes
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

   that.setUserData = function (d) {
      my.body.userData = d;
   }

   that.getUserData = function (d) { 
      return my.body.userData;
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
   my.polygonShape.SetAsBox(spec.width / 2 / ppm, spec.height / 2 / ppm);
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

   my.circleShape = new b2CircleShape(spec.radius / ppm);
   my.fixtureDef.shape = my.circleShape;

   that.getRadius = function ( ) {
      return spec.radius;
   }

   return that;
};

// Application
function Phynix() {
   var _this = this; 

   // Application variables
   blocks = {};
   commandInput = document.getElementById('commandInput');
   commandHistory = [''];
   commandIndex = 0;
   commandInput = null
   paused = false;

   // Drawing 
   ppm = 30.0; // draw scale (pixels-per-meters)
   canvas = null;
   context = null;
   mouse = {x: 0, y: 0, down: false, PVec: null};
   inputHeight = 60; //document.getElementById('commandInput').height;
   selectedBody = null
   mouseJoint = null
   canvasPosition = null

   // Box2D world object
   var world = new b2World(
         new b2Vec2(0, 10)    //gravity
      ,  true                 //allow sleep
   );

   this.initialize = function() {
      commandInput = document.getElementById('commandInput');
      commandInput.onkeydown = inputKeyDown;

      canvas = document.getElementById('canvas');
      context = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - commandInput.clientHeight;
      canvasPosition = getElementPosition(canvas)

      window.onresize = function(event) {
         canvas.width = window.innerWidth;
         canvas.height = window.innerHeight;
         canvas.width = canvas.width;
      }

      setupBox2D();
      window.setInterval(update, 1000 / 60);
   };

   var setupBox2D = function() {
      var fixDef = new b2FixtureDef;
      fixDef.density = 1.0;
      fixDef.friction = 0.5;
      fixDef.restitution = 0.2;
      var bodyDef = new b2BodyDef;
      
      // Create ground
      bodyDef.type = b2Body.b2_staticBody;
      fixDef.shape = new b2PolygonShape; 
      fixDef.shape.SetAsBox(canvas.width / (4*ppm), 20 / ppm);
      bodyDef.position.Set(canvas.width / (2*ppm), canvas.height / ((4/3)*ppm));
      world.CreateBody(bodyDef).CreateFixture(fixDef);

      fixDef.shape.SetAsBox(4*canvas.width / (ppm), 20 / ppm);
      bodyDef.position.Set(canvas.width / (2*ppm), canvas.height / (ppm));
      world.CreateBody(bodyDef).CreateFixture(fixDef);
      
      // Debug draw
      var debugDraw = new b2DebugDraw();
      debugDraw.SetSprite(context);
      debugDraw.SetDrawScale(ppm);
      debugDraw.SetFillAlpha(0.5);
      debugDraw.SetLineThickness(1.0);
      debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      world.SetDebugDraw(debugDraw);

      document.addEventListener("mousemove", mouseMove, true);
      document.addEventListener("contextmenu", mouseRight, false);

      document.addEventListener("mousedown", function(e) {
         mouseDown(e);
         mouse.down = true;
         mouseMove(e);
         // document.addEventListener("mousemove", mouseMove, true);
      }, true);
      
      document.addEventListener("mouseup", function() {
         // document.removeEventListener("mousemove", mouseMove, true);
         mouse.down = false;
         // mouse.x = undefined;
         // mouse.y = undefined;
      }, true);
   };

   var mouseRight = function(event) {
      event.preventDefault();
      var b = getBodyAtMouse(); 
      if (b) {
         if (b.userData) {
            rm(b.userData);
         } else {
            removeBody(b);
         }
      }
      return false;
   };

   var mouseDown = function(event) {
      console.log(getBodyAtMouse());
   };

   var mouseMove = function(event) {
      mouse.x = (event.clientX - canvasPosition.x) / ppm;
      mouse.y = (event.clientY - canvasPosition.y) / ppm;
   };

   var getBodyAtMouse = function() {
      mouse.PVec = new b2Vec2(mouse.x, mouse.y);
      var aabb = new b2AABB();
      aabb.lowerBound.Set(mouse.x - 0.001, mouse.y - 0.001);
      aabb.upperBound.Set(mouse.x + 0.001, mouse.y + 0.001);
      // Query the world for overlapping shapes.
      selectedBody = null;
      world.QueryAABB(getBodyCB, aabb);
      return selectedBody
   };

   var getBodyCB = function(fixture) {
      if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
         if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mouse.PVec)) {
            selectedBody = fixture.GetBody();
            return false;
         }
      }
      return true;
   };

   var update = function() {
      if (!paused) {
         if(mouse.down && (!mouseJoint)) {
            var body = getBodyAtMouse();
            if(body) {
               var md = new b2MouseJointDef();
               md.bodyA = world.GetGroundBody();
               md.bodyB = body;
               md.target.Set(mouse.x, mouse.y);
               md.collideConnected = true;
               md.maxForce = 300.0 * body.GetMass();
               mouseJoint = world.CreateJoint(md);
               body.SetAwake(true);
            }
         }
         
         if(mouseJoint) {
            if(mouse.down) {
               mouseJoint.SetTarget(new b2Vec2(mouse.x, mouse.y));
            } else {
               world.DestroyJoint(mouseJoint);
               mouseJoint = null;
            }
         }
      
         world.Step(1 / 60, 10, 10);
         world.ClearForces();
      }
      world.DrawDebugData();
   };

   var parseCommand = function(input) {
      var reOpt = /^--(\w+)=(\w+)$/;
      var arr = input.split(' ');
      var rawArgs = arr.splice(1, arr.length);
      var cmd = {"name": arr[0], "args": [], "opts": {}};

      for (var i=0; i < rawArgs.length; i++) {
         var opt = rawArgs[i].match(reOpt);
         if (opt) {
            cmd.opts[opt[1]] = opt[2];
         } else {
            cmd.args.push(rawArgs[i]);
         }
      }

      return cmd;
   };

   var parseArgs = function(args) {
      for (var i = args.length - 1; i >= 0; i--) {
         if (parseInt(args[i])) {
            args[i] = parseInt(args[i]);
         } else {
            return i;
         }
      }
      return -1;
   };

   var wrongArgLength = function(args, n) {
      if (args.length != n) {
         return "ERROR: expected "+n+" arguments, got " + cmd.args.length;
      } else {
         return null;
      }
   };

   var runCommand = function(command) {
      var commands = {
         "mkbox": function(input) {
            var cmd = parseCommand(input);
            var rotation = 0;
            var err = parseArgs(cmd.args);

            if (err != -1) {
               return "ERROR: invalid argument: " + cmd.args[err];
            } else if (wrongArgLength(cmd.args, 4)) {
               return wrongArgLength(cmd.args, 4);
            }

            if (cmd.opts['rot']) {
                rotation = cmd.opts['rot'];
            }
            var w = cmd.args[0];
            var h = cmd.args[1];
            var x = cmd.args[2];
            var y = cmd.args[3];

            var b = box({id: cmd.opts['id'], width: w, height: h});
            return createBlock(b, x, y, rotation);

            return 
         },
         "rm": function(input) {            
            var cmd = parseCommand(input);

            if (wrongArgLength(cmd.args, 1)) {
               return wrongArgLength(cmd.args, 1);
            }

            return rm(cmd.args[0]);
         }
      };

      if (command != '') {
         commandHistory.splice(1, 0, command);
         commandIndex = 0;
         commandInput.value = '';
         cmd = command.split(' ')[0];

         console.log('Input: ' + command);
         console.log('Command: ' + cmd); 

         if (commands[cmd] != undefined) {
            console.log(commands[cmd](command));
         } else {
            console.log('Oops!');
         }
         // eval('__command_' + command);
      }
   };

   var inputKeyDown = function(event) {
      console.log('keydown');
      if (event.keyCode == 13) { // enter
         runCommand(commandInput.value);
      }

      // up arrow
      if ((event.keyCode == 38) && (commandIndex + 1 < commandHistory.length)) { 
         commandIndex++;
      }

      if ((event.keyCode == 40) && (commandIndex - 1 >= 0)) {
         commandIndex--; 
      }

      if (event.keyCode == 38 || event.keyCode == 40) {
         commandInput.value = commandHistory[commandIndex];
      }
   };

   var createBlock = function(b, x, y, rotation) {
      b.getBodyDef().position.Set(x / ppm, y / ppm);

      if (b.getID()) {
         if (blocks[b.getID()]) {
            return "ERROR: there's already a block '" + b.getID() + "'"
         } else {
            blocks[b.getID()] = b;
         }
      }

      b.setBody(world.CreateBody(b.getBodyDef()));
      b.getBody().CreateFixture(b.getFixtureDef());
      b.setUserData(b.getID());

      if (rotation)
      {
         var t = new b2Transform(b.getBody().GetPosition(), b2Mat22.FromAngle(rotation * (Math.PI / 180)));
         b.getBody().SetTransform(t);
      }

      return "Box created at (" + x + ", " + y + ")"
   };

   var removeBody = function(body) {
      world.DestroyBody(body);
   };

   var rm = function(id) {
      if (blocks[id]) {
         removeBody(blocks[id].getBody());
         blocks[id] = undefined;
         return "Block '" + id + "' removed"
      } else {
         return "ERROR: unknown block '" + id + "'"
      }
   };

   var mkbox = function(x, y, w, h, rotation, identifier) {
      var b = box({id: identifier, width: w, height: h});

      createBlock(b, x, y, rotation);
   };

   var mkcir = function(x, y, r, identifier) {
      var c = circle({id: identifier, radius: r});

      createBlock(c, x, y);
   };

   var mkjnt = function(id1, id2) {
      var block1 = blocks[id1],
          block2 = blocks[id2];

      var distanceJointDef = new b2DistanceJointDef;
      distanceJointDef.Initialize(block1.getBody(), block2.getBody(), block1.getBody().GetWorldCenter(), block2.getBody().GetWorldCenter());

      world.CreateJoint(distanceJointDef);
   };

   var pause = function() {
      paused = !paused;
   };
}
