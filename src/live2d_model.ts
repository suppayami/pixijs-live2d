import * as Pixi from 'pixi.js'
import 'whatwg-fetch'

import { Live2DCubismFramework as cubismusermodel } from '../cubism-sdk/Framework/dist/model/cubismusermodel'
import { Live2DCubismFramework as icubismmodelsetting } from '../cubism-sdk/Framework/dist/icubismmodelsetting'
import { Live2DCubismFramework as cubismmodelsettingjson } from '../cubism-sdk/Framework/dist/cubismmodelsettingjson'
import { TextureManager } from './texture_manager'

enum LoadingState {
    Init,
    LoadingTextures,
    LoadedTextures,
}

export class Live2DModel extends Pixi.Container {
    protected cubismModel = new cubismusermodel.CubismUserModel()
    protected cubismSetting: icubismmodelsetting.ICubismModelSetting
    protected assetHomeDir = ''
    protected motion = null
    protected loadingState: LoadingState = LoadingState.Init

    constructor(
        setting: icubismmodelsetting.ICubismModelSetting,
        private readonly textureManager: TextureManager,
    ) {
        super()
        this.cubismSetting = setting
    }

    static async fromModel(
        path: string,
        textureManager: TextureManager,
    ): Promise<Live2DModel> {
        const res = await fetch(path)
        const buffer = await res.arrayBuffer()

        const setting = new cubismmodelsettingjson.CubismModelSettingJson(
            buffer,
            buffer.byteLength,
        )

        const model = new Live2DModel(setting, textureManager)
        model.assetHomeDir = path.split('/').slice(0, -1).join('/')
        await model.setupCubismModel()

        return model
    }

    public async setupCubismModel() {
        const cubismModel = this.cubismModel

        cubismModel.setInitialized(false)
        cubismModel.setUpdating(true)

        if (this.cubismSetting.getModelFileName() != '') {
            const modelFileName = this.cubismSetting.getModelFileName()

            const res = await fetch(`${this.assetHomeDir}/${modelFileName}`)
            const buffer = await res.arrayBuffer()

            cubismModel.loadModel(buffer)
        }

        cubismModel.createRenderer()
    }

    protected _render(renderer: Pixi.Renderer) {
        const cubismModel = this.cubismModel
        const cubismRenderer = cubismModel.getRenderer()

        if (this.loadingState === LoadingState.Init) {
            this.setupTextures()
            this.loadingState = LoadingState.LoadingTextures
            return
        }

        renderer.batch.reset()
        renderer.geometry.reset()
        renderer.shader.reset()
        renderer.state.reset()

        if (this.loadingState === LoadingState.LoadedTextures) {
            if (!cubismRenderer.gl) {
                cubismRenderer.startUp(renderer.gl)
            }
            const viewport: number[] = [0, 0, renderer.width, renderer.height]
            cubismRenderer.setIsPremultipliedAlpha(true)
            cubismRenderer.setRenderState(
                renderer.gl.getParameter(renderer.gl.FRAMEBUFFER_BINDING),
                viewport,
            )
            cubismModel
                .getModelMatrix()
                .scale(0.5, (renderer.width / renderer.height) * 0.5)
            cubismRenderer.setMvpMatrix(cubismModel.getModelMatrix())
            cubismRenderer.drawModel()

            const texture = Pixi.Texture.WHITE.baseTexture
            renderer.texture.bind(texture, 0)
        }

        renderer.gl.activeTexture(
            WebGLRenderingContext.TEXTURE0 + renderer.texture.currentLocation,
        )
    }

    private async setupTextures() {
        // テクスチャ読み込み用
        const textureCount: number = this.cubismSetting.getTextureCount()

        for (
            let modelTextureNumber = 0;
            modelTextureNumber < textureCount;
            modelTextureNumber++
        ) {
            // テクスチャ名が空文字だった場合はロード・バインド処理をスキップ
            if (
                this.cubismSetting.getTextureFileName(modelTextureNumber) == ''
            ) {
                console.log('getTextureFileName null')
                continue
            }

            // WebGLのテクスチャユニットにテクスチャをロードする
            const texturePath =
                this.assetHomeDir +
                '/' +
                this.cubismSetting.getTextureFileName(modelTextureNumber)

            const texture = await this.textureManager.loadTexture(texturePath)
            this.cubismModel
                .getRenderer()
                .bindTexture(modelTextureNumber, texture)
        }

        this.loadingState = LoadingState.LoadedTextures
    }
}
