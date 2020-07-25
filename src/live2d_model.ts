import * as Pixi from 'pixi.js'

import { Live2DCubismFramework as cubismusermodel } from '../cubism-sdk/Framework/dist/model/cubismusermodel'
import { Live2DCubismFramework as icubismmodelsetting } from '../cubism-sdk/Framework/dist/icubismmodelsetting'
import { loadCubismModel } from './cubism_loader'

export class Live2DModel extends Pixi.Container {
    protected cubismModel = new cubismusermodel.CubismUserModel()
    protected assetHomeDir = ''
    protected contextId = -1

    constructor(
        protected readonly cubismSetting: icubismmodelsetting.ICubismModelSetting,
        protected readonly textures: Pixi.Texture[],
    ) {
        super()
    }

    static async fromModel(path: string): Promise<Live2DModel> {
        const dir = path.split('/').slice(0, -1).join('/')
        const filename = path.split('/').pop() ?? ''
        const { setting, textures, modelBuffer } = await loadCubismModel(
            dir,
            filename,
        )

        const model = new Live2DModel(setting, textures)
        model.assetHomeDir = path.split('/').slice(0, -1).join('/')
        await model.setupCubismModel(modelBuffer)

        return model
    }

    public async setupCubismModel(modelBuffer?: ArrayBuffer) {
        const cubismModel = this.cubismModel

        if (!modelBuffer) {
            return
        }

        cubismModel.setInitialized(false)
        cubismModel.setUpdating(true)
        cubismModel.loadModel(modelBuffer)
        cubismModel.createRenderer()
    }

    protected _render(renderer: Pixi.Renderer) {
        const cubismModel = this.cubismModel
        const cubismRenderer = cubismModel.getRenderer()

        if (this.contextId !== (renderer as any).CONTEXT_UID) {
            this.contextId = (renderer as any).CONTEXT_UID
            this.setupTextures(renderer)
            cubismRenderer.startUp(renderer.gl)
        }

        renderer.batch.reset()
        renderer.geometry.reset()
        renderer.shader.reset()
        renderer.state.reset()

        const viewport: number[] = [0, 0, renderer.width, renderer.height]
        cubismRenderer.setIsPremultipliedAlpha(true)
        cubismRenderer.setRenderState(
            renderer.gl.getParameter(renderer.gl.FRAMEBUFFER_BINDING),
            viewport,
        )
        cubismModel
            .getModelMatrix()
            .scale(
                this.scale.x,
                (renderer.width / renderer.height) * this.scale.y,
            )
        cubismModel.getModelMatrix().setX(-1 + (this.x / renderer.width) * 2)
        cubismModel.getModelMatrix().setY(1 - (this.y / renderer.height) * 2)
        cubismRenderer.setMvpMatrix(cubismModel.getModelMatrix())
        cubismRenderer.drawModel()

        const texture = Pixi.Texture.WHITE.baseTexture
        renderer.texture.bind(texture, 0)

        renderer.gl.activeTexture(
            WebGLRenderingContext.TEXTURE0 + renderer.texture.currentLocation,
        )
    }

    private async setupTextures(renderer: Pixi.Renderer) {
        for (let i = 0; i < this.textures.length; i++) {
            const texture = this.textures[i]
            const baseTexture = texture.baseTexture as any
            renderer.texture.bind(texture.baseTexture, 0)
            this.cubismModel
                .getRenderer()
                .bindTexture(i, baseTexture._glTextures[this.contextId].texture)

            baseTexture.touched = renderer.textureGC.count
        }
    }
}
