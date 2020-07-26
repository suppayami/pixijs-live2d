import * as Pixi from 'pixi.js'

import { Live2DCubismFramework as live2dcubismframework } from '../cubism-sdk/Framework/dist/live2dcubismframework'
import { Live2DCubismFramework as cubismdefaultparameterid } from '../cubism-sdk/Framework/dist/cubismdefaultparameterid'
import { Live2DCubismFramework as cubismid } from '../cubism-sdk/Framework/dist/id/cubismid'
import { Live2DCubismFramework as icubismmodelsetting } from '../cubism-sdk/Framework/dist/icubismmodelsetting'
import { Live2DCubismFramework as acubismmotion } from '../cubism-sdk/Framework/dist/motion/acubismmotion'
import { Live2DCubismFramework as cubismeyeblink } from '../cubism-sdk/Framework/dist/effect/cubismeyeblink'
import { Live2DCubismFramework as cubismbreath } from '../cubism-sdk/Framework/dist/effect/cubismbreath'
import { Live2DCubismFramework as csmvector } from '../cubism-sdk/Framework/dist/type/csmvector'
import { loadCubismModel, ArrayBufferMap } from './cubism_loader'
import { Live2DInternalModel } from './live2d_internal_model'

export class Live2DModel extends Pixi.Container {
    protected cubismModel = new Live2DInternalModel()
    protected assetHomeDir = ''
    protected contextId = -1

    protected expressions: { [key: string]: acubismmotion.ACubismMotion } = {}
    protected idParamAngleX: cubismid.CubismId
    protected idParamAngleY: cubismid.CubismId
    protected idParamAngleZ: cubismid.CubismId
    protected idParamEyeBallX: cubismid.CubismId
    protected idParamEyeBallY: cubismid.CubismId
    protected idParamBodyAngleX: cubismid.CubismId

    constructor(
        protected readonly cubismSetting: icubismmodelsetting.ICubismModelSetting,
        protected readonly textures: Pixi.Texture[],
    ) {
        super()

        Pixi.Ticker.shared.add(this.onTickerUpdate, this)
        this.idParamAngleX = live2dcubismframework.CubismFramework.getIdManager().getId(
            cubismdefaultparameterid.ParamAngleX,
        )
        this.idParamAngleY = live2dcubismframework.CubismFramework.getIdManager().getId(
            cubismdefaultparameterid.ParamAngleY,
        )
        this.idParamAngleZ = live2dcubismframework.CubismFramework.getIdManager().getId(
            cubismdefaultparameterid.ParamAngleZ,
        )
        this.idParamEyeBallX = live2dcubismframework.CubismFramework.getIdManager().getId(
            cubismdefaultparameterid.ParamEyeBallX,
        )
        this.idParamEyeBallY = live2dcubismframework.CubismFramework.getIdManager().getId(
            cubismdefaultparameterid.ParamEyeBallY,
        )
        this.idParamBodyAngleX = live2dcubismframework.CubismFramework.getIdManager().getId(
            cubismdefaultparameterid.ParamBodyAngleX,
        )
    }

    static async fromModel(path: string): Promise<Live2DModel> {
        const dir = path.split('/').slice(0, -1).join('/')
        const filename = path.split('/').pop() ?? ''
        const {
            setting,
            textures,
            modelBuffer,
            expressions,
            physics,
            pose,
        } = await loadCubismModel(dir, filename)

        const model = new Live2DModel(setting, textures)
        model.assetHomeDir = path.split('/').slice(0, -1).join('/')
        await model.setupCubismModel(modelBuffer)
        await model.setupCubismExpressions(expressions)
        await model.setupPhysics(physics)
        await model.setupPose(pose)
        await model.setupEyeBlink()
        await model.setupBreath()

        return model
    }

    public destroy(options?: {
        children?: boolean
        texture?: boolean
        baseTexture?: boolean
    }) {
        this.release()
        Pixi.Ticker.shared.remove(this.onTickerUpdate, this)
        super.destroy(options)
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

    public async setupCubismExpressions(expressionBuffers: ArrayBufferMap) {
        const cubismModel = this.cubismModel

        Object.entries(expressionBuffers).forEach(
            ([expressionName, expressionBuffer]) => {
                const motion = cubismModel.loadExpression(
                    expressionBuffer,
                    expressionBuffer.byteLength,
                    expressionName,
                )

                if (this.expressions[expressionName]) {
                    acubismmotion.ACubismMotion.delete(
                        this.expressions[expressionName],
                    )
                }

                this.expressions[expressionName] = motion
            },
        )
    }

    public async setupPhysics(physicBuffer?: ArrayBuffer) {
        const cubismModel = this.cubismModel
        if (!physicBuffer) {
            return
        }
        cubismModel.loadPhysics(physicBuffer, physicBuffer.byteLength)
    }

    public async setupPose(poseBuffer?: ArrayBuffer) {
        const cubismModel = this.cubismModel
        if (!poseBuffer) {
            return
        }
        cubismModel.loadPose(poseBuffer, poseBuffer.byteLength)
    }

    public async setupEyeBlink() {
        const cubismSetting = this.cubismSetting
        const model = this.cubismModel

        if (cubismSetting.getEyeBlinkParameterCount() === 0) {
            return
        }

        model.setEyeBlink(cubismeyeblink.CubismEyeBlink.create(cubismSetting))
    }

    public async setupBreath() {
        const model = this.cubismModel
        const breath = cubismbreath.CubismBreath.create()

        const breathParameters: csmvector.csmVector<cubismbreath.BreathParameterData> = new csmvector.csmVector()
        breathParameters.pushBack(
            new cubismbreath.BreathParameterData(
                this.idParamAngleX,
                0.0,
                15.0,
                6.5345,
                0.5,
            ),
        )
        breathParameters.pushBack(
            new cubismbreath.BreathParameterData(
                this.idParamAngleY,
                0.0,
                8.0,
                3.5345,
                0.5,
            ),
        )
        breathParameters.pushBack(
            new cubismbreath.BreathParameterData(
                this.idParamAngleZ,
                0.0,
                10.0,
                5.5345,
                0.5,
            ),
        )
        breathParameters.pushBack(
            new cubismbreath.BreathParameterData(
                this.idParamBodyAngleX,
                0.0,
                4.0,
                15.5345,
                0.5,
            ),
        )
        breathParameters.pushBack(
            new cubismbreath.BreathParameterData(
                live2dcubismframework.CubismFramework.getIdManager().getId(
                    cubismdefaultparameterid.ParamBreath,
                ),
                0.0,
                0.5,
                3.2345,
                0.5,
            ),
        )

        breath.setParameters(breathParameters)

        model.setBreath(breath)
    }

    protected _render(renderer: Pixi.Renderer) {
        const cubismModel = this.cubismModel
        const cubismRenderer = cubismModel.getRenderer()

        if (!cubismRenderer) {
            return
        }

        if (this.contextId !== (renderer as any).CONTEXT_UID) {
            this.contextId = (renderer as any).CONTEXT_UID
            this.setupTextures(renderer)
            cubismRenderer.startUp(renderer.gl)
        }

        this.touchTextures(renderer)

        renderer.batch.flush()
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

        const texture = this.textures[0].baseTexture
        renderer.texture.bind(texture, 0)

        renderer.gl.activeTexture(
            WebGLRenderingContext.TEXTURE0 + renderer.texture.currentLocation,
        )

        renderer.texture.reset()
        renderer.geometry.reset()
        renderer.state.reset()
        renderer.shader.reset()
        renderer.framebuffer.reset()

        renderer.gl.viewport(0, 0, renderer.view.width, renderer.view.height)
    }

    protected release() {
        this.cubismModel.release()
    }

    private async setupTextures(renderer: Pixi.Renderer) {
        for (let i = 0; i < this.textures.length; i++) {
            const texture = this.textures[i]
            const baseTexture = texture.baseTexture as any
            renderer.texture.bind(texture.baseTexture, 0)
            this.cubismModel
                .getRenderer()
                .bindTexture(i, baseTexture._glTextures[this.contextId].texture)
        }
    }

    private touchTextures(renderer: Pixi.Renderer) {
        for (let i = 0; i < this.textures.length; i++) {
            const texture = this.textures[i]
            const baseTexture = texture.baseTexture as any
            baseTexture.touched = renderer.textureGC.count
        }
    }

    private onTickerUpdate = (dt: number) => {
        const deltaTime = dt / Pixi.Ticker.shared.deltaMS
        let motionUpdated = false

        const model = this.cubismModel
        const motionManager = model.getMotionManager()
        const expressionManager = model.getExpressionManager()
        const physics = model.getPhysics()
        const pose = model.getPose()
        const breath = model.getBreath()

        model.getModel().loadParameters()
        if (motionManager.isFinished()) {
        } else {
            motionUpdated = motionManager.updateMotion(
                model.getModel(),
                deltaTime,
            )
        }
        model.getModel().saveParameters()

        if (!motionUpdated) {
            if (model.getEyeBlink()) {
                model
                    .getEyeBlink()
                    .updateParameters(model.getModel(), deltaTime)
            }
        }

        if (expressionManager) {
            expressionManager.updateMotion(model.getModel(), deltaTime)
        }

        if (physics) {
            physics.evaluate(model.getModel(), deltaTime)
        }

        if (pose) {
            pose.updateParameters(model.getModel(), deltaTime)
        }

        if (breath) {
            breath.updateParameters(model.getModel(), deltaTime)
        }

        model.getModel().update()
    }
}
