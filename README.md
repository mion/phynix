# Phynix

Create physics simulations using Unix-like commands.

Read the instructions and then [click here](http://mion.github.io/phynix/) to play it in your browser.

Phynix is built on [box2dweb](http://code.google.com/p/box2dweb/) (a port of Box2DFlash to JavaScript). The original [Box2D](http://box2d.org/) physics engine was developed by Erin Catto.

## Commands

You can create and destroy bodies or joints using one of the following Unix-like commands:

* mkbox - _Make box_
* mkcir - _Make circle_
* mkjnt - _Make joint_
* rm - _Remove_ (a box, circle or joint)
* ls - _List_ bodies and joints

### Make box
A _box_ is simply a rectangle. You create one with:

     mkbox(x, y, w, h, rotation, identifier)
     
Where ´´identifier´´ is a string used to refer to this block in other commands (such as remove). It is optional, though.
Here's a basic example:

    mkbox(103, 59, 20, 25, 0, "box1")

Create a 20x25 box at (103, 59), rotated by 45 degrees and call it *box1*.

### Make joint
A _joint_ is a fixed distance connection between two bodies. Box2D actually supports several types of joints, but for now there's only one kind :P

    mkjnt(id1, id2)

You pass in two identifiers and the corresponding blocks will be connected by a distance joint (see *Box2D*).

### Make circle
Similar to _mkbox_:

    mkcir(x, y, r, identifier)

## To-do's
Lots of stuff!
* Polygons
* Create a lexer/tokenizer to eliminate the need for parenthesis and commas: mkjnt(a, b) --> mkjnt a b
* Gears, other types of joints... 

I'll see to it when I have time. But this should be enough to have some fun :)
