/*
 *  Phynix - Create physical simulations with Unix-like commands.
 *  - Thanks to the Box2D port from Flash to JS: box2dweb (http://code.google.com/p/box2dweb/)
 *  - And the original Box2D (http://box2d.org/) physics engine was developed by Erin Catto
 *
 *  - By Gabriel Vieira (https://github.com/mion)
 */

// IE shim (https://developer.mozilla.org/en-US/docs/DOM/window.setInterval)
if (document.all && !window.setTimeout.isPolyfill) {
  var __nativeST__ = window.setTimeout;
  window.setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
    var aArgs = Array.prototype.slice.call(arguments, 2);
    return __nativeST__(vCallback instanceof Function ? function () {
      vCallback.apply(null, aArgs);
    } : vCallback, nDelay);
  };
  window.setTimeout.isPolyfill = true;
}

if (document.all && !window.setInterval.isPolyfill) {
  var __nativeSI__ = window.setInterval;
  window.setInterval = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
    var aArgs = Array.prototype.slice.call(arguments, 2);
    return __nativeSI__(vCallback instanceof Function ? function () {
      vCallback.apply(null, aArgs);
    } : vCallback, nDelay);
  };
  window.setInterval.isPolyfill = true;
}

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
var Block = function (spec, my) {
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

var Box = function(spec, my) {
   var that;
   my = my || {};

   that = Block(spec, my);

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

var Circle = function (spec, my) {
   var that;
   my = my || {};

   that = Block(spec, my);

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
   bubbles = document.getElementById('bubbles');
   notifications = [];
   help = document.getElementById('help');
   mouseCoord = document.getElementById('mouse-coord');
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

      document.addEventListener("contextmenu", mouseRight, false);
      document.addEventListener("mousemove", function(event) {
         mouseCoord.innerHTML = icon('globe') + ' ' + (event.clientX - canvasPosition.x).toString() + " , " + (event.clientY - canvasPosition.y).toString();
      });

      document.addEventListener("mousedown", function(e) {
         mouseDown(e);
         mouse.down = true;
         // mouseMove(e);
         document.addEventListener("mousemove", mouseMove, true);
      }, true);
      
      document.addEventListener("mouseup", function() {
         document.removeEventListener("mousemove", mouseMove, true);
         mouse.down = false;
         mouse.x = undefined;
         mouse.y = undefined;
      }, true);
   };

   var mouseRight = function(event) {
      event.preventDefault();
      x = (event.clientX - canvasPosition.x) / ppm;
      y = (event.clientY - canvasPosition.y) / ppm;
      var b = getBodyAtMouse(x, y);
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
      x = (event.clientX - canvasPosition.x) / ppm;
      y = (event.clientY - canvasPosition.y) / ppm;
      var body = getBodyAtMouse(x, y);
      if (body) {
         notifyInfo(getBodyInfo(body));
      }
      // if (event.keyCode) {
      //    commandInput.value += mouseCoord.innerText;
      // }
   };

   var icon = function(name) {
      return '<i class="icon-'+name+'"></i>'
   };

   var notifyCreated = function(text) { notify('magic', text); };
   var notifyRemoved = function(text) { notify('trash', text); };
   var notifyInfo = function(text) { notify('lightbulb', text); };
   var notifyError = function(text) { notify('remove', text); };

   var notify = function(name, text) {
      var notf = document.createElement("li");
      notf.classList.add('bubble');//, 'animated', 'fadeInLeft');
      notf.innerHTML = icon(name) + ' ' + text;

      bubbles.insertAdjacentElement('beforeend', notf);
      notifications.unshift(notf);

      window.setTimeout(removeNotification, 2500);
   };

   var removeNotification = function() {
      notf = notifications.pop().remove();
      // notf.classList.add('fadeOutLeft');
      // window.setTimeout(notf.remove, 1000);
   };

   var getBodyInfo = function(body) {
      var s = body.userData ? "Object '" + body.userData + "' " : "Unidentified object ";
      var x = body.GetPosition().x.toFixed(2);
      var y = body.GetPosition().y.toFixed(2);
      var mass = body.GetMass().toFixed(2);
      var r = body.GetAngle().toFixed(2);
      return s + "at ("+x+", "+y+") / rotation: " + r + " rad / mass: " + mass + " kg";
   };

   var mouseMove = function(event) {
      mouse.x = (event.clientX - canvasPosition.x) / ppm;
      mouse.y = (event.clientY - canvasPosition.y) / ppm;
   };

   var getBodyAtMouse = function(x, y) {
      mouseX = mouse.x || x;
      mouseY = mouse.y || y;
      mouse.PVec = new b2Vec2(mouseX, mouseY);
      var aabb = new b2AABB();
      aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
      aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
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
         return "ERROR: expected "+n+" arguments, got " + args.length;
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
               notifyError("ERROR: invalid argument: " + cmd.args[err]);
               return
            } else if (wrongArgLength(cmd.args, 4)) {
               notifyError(wrongArgLength(cmd.args, 4));
               return
            }

            if (cmd.opts['rot']) {
                rotation = cmd.opts['rot'];
            }
            var w = cmd.args[0];
            var h = cmd.args[1];
            var x = cmd.args[2];
            var y = cmd.args[3];

            var b = Box({id: cmd.opts['id'], width: w, height: h});
            createBlock(b, x, y, rotation);
         },
         "mkcir": function(input) {
            var cmd = parseCommand(input);
            var err = parseArgs(cmd.args);

            if (err != -1) {
               notifyError("ERROR: invalid argument: " + cmd.args[err]);
               return
            } else if (wrongArgLength(cmd.args, 3)) {
               notifyError(wrongArgLength(cmd.args, 3));
               return
            }

            var r = cmd.args[0];
            var x = cmd.args[1];
            var y = cmd.args[2];

            var c = Circle({id: cmd.opts['id'], radius: r});
            createBlock(c, x, y);
         },
         "rm": function(input) {            
            var cmd = parseCommand(input);

            if (wrongArgLength(cmd.args, 1)) {
               notifyError(wrongArgLength(cmd.args, 1));
               return
            }

            rm(cmd.args[0]);
         },
         "mkjnt": function(input) {
            var cmd = parseCommand(input);

            if (wrongArgLength(cmd.args, 2)) {
               notifyError(wrongArgLength(cmd.args, 2));
               return
            }

            var block1 = blocks[cmd.args[0]],
                block2 = blocks[cmd.args[1]];

            if (!block1) { notifyError("ERROR: no object with ID = '" + cmd.args[0] + "'"); return; }
            if (!block2) { notifyError("ERROR: no object with ID = '" + cmd.args[1] + "'"); return; }
         

            var distanceJointDef = new b2DistanceJointDef;
            distanceJointDef.Initialize(block1.getBody(), block2.getBody(), block1.getBody().GetWorldCenter(), block2.getBody().GetWorldCenter());

            world.CreateJoint(distanceJointDef);

            notifyCreated("Joint created between '" + cmd.args[0] +"' and '" + cmd.args[1] + "'");
         },
         "frz": function(input) {
            paused = !paused;
            notifyInfo(paused ? "Paused" : "Unpaused");
         },
         "help": function(input) {
            help.hidden = !help.hidden;
         }
      };

      if (command != '') {
         commandHistory.splice(1, 0, command);
         commandIndex = 0;
         commandInput.value = '';
         cmd = command.split(' ')[0];

         if (commands[cmd] != undefined) {
            commands[cmd](command);
         } else {
            notifyError("ERROR: unknown command '"+cmd+"'");
         }
      }
   };

   var inputKeyDown = function(event) {
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
            notifyError("ERROR: there's already an object with ID = '" + b.getID() + "'")
            return
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

      notifyCreated("Object "+(b.getID() ? b.getID() : "")+" created at (" + x + ", " + y + ")");
   };

   var removeBody = function(body) {
      world.DestroyBody(body);
      if (body.userData) {
         notifyRemoved("Object '" + body.userData + "' removed")
      } else {         
         notifyRemoved("Object removed")
      }
   };

   var rm = function(id) {
      if (blocks[id]) {
         removeBody(blocks[id].getBody());
         blocks[id] = undefined;
      } else {
         notifyError("ERROR: no object with ID = '" + id + "'")
      }
   };

   var mkbox = function(x, y, w, h, rotation, identifier) {
      var b = Box({id: identifier, width: w, height: h});

      createBlock(b, x, y, rotation);
   };

   var mkcir = function(x, y, r, identifier) {
      var c = Circle({id: identifier, radius: r});

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
