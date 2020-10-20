import * as PIXI from 'pixi.js'

import {
    Live2DCubismFramework as live2dcubismframework,
    Option,
    LogLevel,
} from '../cubism-sdk/Framework/dist/live2dcubismframework'
import { Live2DModel } from '../src/live2d_model'

const CubismFramework = live2dcubismframework.CubismFramework

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application({
    width: 1280,
    height: 720,
})

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
    .add('json', 'Haru/Haru.model3.json')
    .load(async (_loader, resources) => {
        const bg = new PIXI.Sprite(resources?.background?.texture)
        const model2 = await Live2DModel.fromModel('/Haru/Haru.model3.json')

        // Setup the position of the bunny
        bg.x = app.renderer.width / 2
        bg.y = app.renderer.height / 2

        // Rotate around the center
        bg.anchor.x = 0.5
        bg.anchor.y = 0.5

        model2.x += 1280 / 2

        model2.y = 400

        model2.scale.set(0.7, 0.7)
        model2.playExpression('f03')
        model2.setOpacity(0.2)

        setInterval(() => {
            model2.playRandomMotion('TapBody', 100)
        }, 1000)

        // Add the bunny to the scene we are building
        app.stage.addChild(bg)
        app.stage.addChild(model2)
    })
