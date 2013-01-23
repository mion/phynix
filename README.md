# Phynix

Create physics simulations using Unix-like commands.

Read the instructions and then [click here](http://www.github.com) to play it in your browser.

Phynix is built on [box2dweb](http://code.google.com/p/box2dweb/) (a port of Box2DFlash to JavaScript). The original [Box2D](http://box2d.org/) physics engine was developed by Erin Catto.

## Commands

You can create and destroy bodies or joints using one of the following Unix-like commands:

* mkbox - _Make box_
* mkcir - _Make circle_
* mkjnt - _Make joint_
* rm - _Remove_ (a box, circle or joint)
* ls - _List_ bodies and joints

### Make box
A _box_ is simply a rectangle. Here's a basic example:

    mkbox 103 59 20 25

Create a 20x25 box at (103, 59).