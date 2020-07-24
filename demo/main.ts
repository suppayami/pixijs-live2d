import * as PIXI from 'pixi.js'

import {
    Live2DCubismFramework as live2dcubismframework,
    Option,
    LogLevel,
} from '../cubism-sdk/Framework/dist/live2dcubismframework'
import { Live2DModel } from '../src/live2d_model'
import { TextureManager } from '../src/texture_manager'

const CubismFramework = live2dcubismframework.CubismFramework

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    width: 1280,
    height: 720,
})
const textureManager = new TextureManager(app.renderer)

const option = new Option()
option.logFunction = (message: string) => console.log(message)
option.loggingLevel = LogLevel.LogLevel_Verbose
CubismFramework.startUp(option)
CubismFramework.initialize()

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view)

// load the texture we need
app.loader
    .add('background', 'back_class_normal.png')
    .load(async (loader, resources) => {
        const bunny = new PIXI.Sprite(resources?.background?.texture)
        const model = await Live2DModel.fromModel(
            '/Haru/Haru.model3.json',
            textureManager,
        )

        // Setup the position of the bunny
        bunny.x = app.renderer.width / 2
        bunny.y = app.renderer.height / 2

        // Rotate around the center
        bunny.anchor.x = 0.5
        bunny.anchor.y = 0.5

        // Add the bunny to the scene we are building
        app.stage.addChild(bunny)
        app.stage.addChild(model)
    })
