import * as PIXI from 'pixi.js'

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    width: 1280,
    height: 720,
})

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view)

// load the texture we need
app.loader
    .add('background', 'back_class_normal.png')
    .load((loader, resources) => {
        const bunny = new PIXI.Sprite(resources?.background?.texture)

        // Setup the position of the bunny
        bunny.x = app.renderer.width / 2
        bunny.y = app.renderer.height / 2

        // Rotate around the center
        bunny.anchor.x = 0.5
        bunny.anchor.y = 0.5

        // Add the bunny to the scene we are building
        app.stage.addChild(bunny)
    })
