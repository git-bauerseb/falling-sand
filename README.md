# Falling sand shooter

![](falling_sand.gif)

## About

This is a falling sand based shooter. For those, that don't know what a falling sand game is: In a falling sand game every pixel (or group) of pixel gets simulated by specific rules like in a cellular automaton. For example if at one position there is a sand element, it checks if there is nothing below it and moves down, if it can. At first, those rules don't seem to be suited for a good looking simulation. But the fact that there are many thousands of pixels makes elements like water appear like real fluids.

## Mechanics

Everything is simulated using only different HTML 5 canvases. At initialization, a predefined image is scanned and for every pixel a suitable element is determined (by color) and written to a buffer. Then, in every simulation step, the buffer is traversed and the particular actions are executed. To know, what function to call (for the action), an index is stored in the lowest two bits of the color (which doesn't change the color really much as it has a max. deviation of 3 for r,g,b which can hardly be noticed by humans).

The rest (projectiles, bunkers, etc.) is simulated by simple newton mechanics.

## Code

Don't look at it, I warn you! Jokes aside, it needs refactoring (what doesn't?) in terms of readability. As I was just quickly prototyping this in about 14 days, a lot of unnecessary code has accumulated.

## Setup

Because i call ``getImageData()`` on a canvas object on which i paint a image there is the error that says: ``The canvas has been tainted by cross-origin data``. To circumvent this problem, simply start a HTTP server ``python3 -m http.server`` and access the site via localhost.


## ToDo

- [ ] More elements (lava, dynamite, fire, steam, etc.) for a richer simulation

- [ ] Sound (mainly for projectiles)
- [ ] More colors


## License

You can use this project for anything you want except for publishing and monetarization.