# Phynix

Phynix is a physics sandbox driven by Unix-like commands.
[Click here](http://mion.github.io/phynix/) to play with it in your browser.

Phynix is built on [box2dweb](http://code.google.com/p/box2dweb/) (a port of Box2DFlash to JavaScript). The original [Box2D](http://box2d.org/) physics engine was developed by Erin Catto.

# How to play

Interaction with the physics engine is done via one of following commands:

### *Make box*

- **mkbox** makes a new box at point `(x, y)` with width `w` and height `h`:
     
          mkbox w h x y [options]
          
     You can associate the box to an ID with the `id` option (to be used with the `mkjnt` and `rm` commands):
     
          mkbox 25 25 400 300 --id=abc
     
     You can change the object's rotation at creation time with the `rot` option:
     
          mkbox 100 20 39 48 --id=xyz --rot=45

### *Make circle*

- **mkcir** makes a new circle at point `(x, y)` with radius `r`
     
          mkcir r x y [options]
          
     You can associate the circle to an ID with the `id` option (to be used with the `mkjnt` and `rm` commands).
     
          mkcir 50 13 49 --id=abc

### *Make joint*

- **mkjnt** welds two objects together with a fixed length joint:
     
          mkjnt abc xyz
          
     They don't need to be of the same type.

### *Remove*

- **rm** removes an object from the world:
     
          rm abc

### *Freeze*

- **frz** pauses/unpauses the physics engine:
          
          frz

# Missing features

* Polygons
* Gears, other types of joints from Box2D
* Joints need IDs too

##### Ideas

* `mv` command could apply force/impulse to a body
* Wild cards: `rm ab*` (removes abc, abd, etc)
* 'Turing completeness': `mkbox 15 15 ${i*20} 30 --id=box$i --i=[1..10)` creates *box1, box2, ..., box9* with *x=20, 40, ..., 180*

# Contributions

If you have a cool idea or want to help with anything, feel free to submit a pull request! :thumbsup:

# License

The MIT License (MIT)

Copyright © 2013 Gabriel Vieira

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
