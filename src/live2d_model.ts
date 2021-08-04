import * as Pixi from 'pixi.js'

import { Live2DCubismFramework as live2dcubismframework } from '../cubism-sdk/Framework/dist/live2dcubismframework'
import { Live2DCubismFramework as cubismdefaultparameterid } from '../cubism-sdk/Framework/dist/cubismdefaultparameterid'
import { Live2DCubismFramework as cubismid } from '../cubism-sdk/Framework/dist/id/cubismid'
import { Live2DCubismFramework as icubismmodelsetting } from '../cubism-sdk/Framework/dist/icubismmodelsetting'
import { Live2DCubismFramework as acubismmotion } from '../cubism-sdk/Framework/dist/motion/acubismmotion'
import { Live2DCubismFramework as cubismeyeblink } from '../cubism-sdk/Framework/dist/effect/cubismeyeblink'
import { Live2DCubismFramework as cubismbreath } from '../cubism-sdk/Framework/dist/effect/cubismbreath'
import { Live2DCubismFramework as csmvector } from '../cubism-sdk/Framework/dist/type/csmvector'
import { Live2DCubismFramework as cubismmotionqueuemanager } from '../cubism-sdk/Framework/dist/motion/cubismmotionqueuemanager'
import { loadCubismModel, ArrayBufferMap } from './cubism_loader'
import { Live2DInternalModel } from './live2d_internal_model'

export class Live2DModel extends Pixi.Sprite {
    public motionRandomGroup = ''

    protected cubismModel = new Live2DInternalModel()
    protected assetHomeDir = ''
    protected contextId = -1

    protected expressions: { [key: string]: acubismmotion.ACubismMotion } = {}
    protected motions: { [key: string]: acubismmotion.ACubismMotion } = {}
    protected idParamAngleX: cubismid.CubismId
    protected idParamAngleY: cubismid.CubismId
    protected idParamAngleZ: cubismid.CubismId
    protected idParamEyeBallX: cubismid.CubismId
    protected idParamEyeBallY: cubismid.CubismId
    protected idParamBodyAngleX: cubismid.CubismId
    protected eyeBlinkIds = new csmvector.csmVector<cubismid.CubismIdHandle>()
    protected lipSyncIds = new csmvector.csmVector<cubismid.CubismIdHandle>()

    protected lipSyncOpen = 0
    protected lookAtPoint: [number, number] | null = null
    protected viewportSize: [number, number] | null = null
    protected isBreathing = true

    protected parameterValues: {
        [name: string]: { target: number; weight: number }
    } = {}

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
            motionBuffers,
            userData,
        } = await loadCubismModel(dir, filename)

        const model = new Live2DModel(setting, textures)
        model.assetHomeDir = path.split('/').slice(0, -1).join('/')
        await model.setupCubismModel(modelBuffer)
        await model.setupCubismExpressions(expressions)
        await model.setupPhysics(physics)
        await model.setupPose(pose)
        await model.setupEyeBlink()
        await model.setupBreath()
        await model.setupUserData(userData)
        await model.setupEyeBlinkIds()
        await model.setupLipSyncIds()
        await model.setupMotion(motionBuffers)

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

        const model = this.cubismModel.getModel()
        this.width = model.getModel().canvasinfo.CanvasWidth
        this.height = model.getModel().canvasinfo.CanvasHeight
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
                0.75,
                2.875,
                0.5,
            ),
        )

        breath.setParameters(breathParameters)

        model.setBreath(breath)
    }

    public async setupUserData(userDataBuffer?: ArrayBuffer) {
        const cubismModel = this.cubismModel
        if (!userDataBuffer) {
            return
        }
        cubismModel.loadUserData(userDataBuffer, userDataBuffer.byteLength)
    }

    public async setupEyeBlinkIds() {
        const eyeBlinkIdCount = this.cubismSetting.getEyeBlinkParameterCount()
        for (let i = 0; i < eyeBlinkIdCount; ++i) {
            this.eyeBlinkIds.pushBack(
                this.cubismSetting.getEyeBlinkParameterId(i),
            )
        }
    }

    public async setupLipSyncIds() {
        const lipSyncIdCount = this.cubismSetting.getLipSyncParameterCount()
        for (let i = 0; i < lipSyncIdCount; ++i) {
            this.lipSyncIds.pushBack(
                this.cubismSetting.getLipSyncParameterId(i),
            )
        }
    }

    /**
     * Public API
     */
    public setLipSyncOpen(value: number) {
        this.lipSyncOpen = Math.min(Math.max(0, value), 1)
    }

    public playMotion(
        group: string,
        index: number,
        priority: number,
        onFinishedHandler?: acubismmotion.FinishedMotionCallback,
    ): cubismmotionqueuemanager.CubismMotionQueueEntryHandle {
        const motionManager = this.cubismModel.getMotionManager()

        // if (!motionManager.reserveMotion(priority)) {
        //     return cubismmotionqueuemanager.InvalidMotionQueueEntryHandleValue
        // }

        const name = `${group}_${index}`
        const motion = this.motions[name]

        motion.setFinishedMotionHandler(onFinishedHandler!) // undefined means remove handler
        return motionManager.startMotionPriority(motion, false, priority)
    }

    public playRandomMotion(
        group: string,
        priority: number,
        onFinishedHandler?: acubismmotion.FinishedMotionCallback,
    ): cubismmotionqueuemanager.CubismMotionQueueEntryHandle {
        if (this.cubismSetting.getMotionCount(group) == 0) {
            return cubismmotionqueuemanager.InvalidMotionQueueEntryHandleValue
        }

        const index = Math.floor(
            Math.random() * this.cubismSetting.getMotionCount(group),
        )

        return this.playMotion(group, index, priority, onFinishedHandler)
    }

    public playExpression(expressionId: string) {
        const motion = this.expressions[expressionId]

        if (!motion) {
            return
        }

        this.cubismModel
            .getExpressionManager()
            .startMotionPriority(motion, false, 10)
    }

    public setViewPoint(x: number, y: number) {
        this.lookAtPoint = [x, y]
    }

    public clearViewPoint() {
        this.lookAtPoint = null
    }

    public setOpacity(opacity: number) {
        this.cubismModel.setOpacity(opacity)
    }

    public getOpacity() {
        return this.cubismModel.getOpacity()
    }

    public setBreathing(isBreathing: boolean) {
        this.isBreathing = isBreathing
    }

    public setParameter(parameter: string, value: number, weight = 1.0) {
        this.parameterValues[parameter] = { target: value, weight }
    }

    public clearParameter(parameter: string) {
        delete this.parameterValues[parameter]
    }

    public getParameter(parameter: string) {
        const id = live2dcubismframework.CubismFramework.getIdManager().getId(
            parameter,
        )

        return this.parameterValues[parameter]
            ? this.parameterValues[parameter].target *
                  this.parameterValues[parameter].weight
            : this.cubismModel.getModel().getParameterValueById(id)
    }

    protected async setupMotion(motionBuffers: ArrayBufferMap) {
        const cubismSetting = this.cubismSetting
        const model = this.cubismModel

        Object.entries(motionBuffers).forEach(([name, buffer]) => {
            const motion = model.loadMotion(buffer, buffer.byteLength, name)
            const nameSplit = name.split('_')
            const group = nameSplit.slice(0, -1).join('_')
            const i = parseInt(nameSplit.pop() ?? '0', 10)

            let fadeTime = cubismSetting.getMotionFadeInTimeValue(group, i)
            if (fadeTime >= 0.0) {
                motion.setFadeInTime(fadeTime)
            }

            fadeTime = cubismSetting.getMotionFadeOutTimeValue(group, i)
            if (fadeTime >= 0.0) {
                motion.setFadeOutTime(fadeTime)
            }
            motion.setEffectIds(this.eyeBlinkIds, this.lipSyncIds)

            if (this.motions[name]) {
                acubismmotion.ACubismMotion.delete(this.motions[name])
            }

            this.motions[name] = motion
        })

        model.getMotionManager().stopAllMotions()
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
            this.viewportSize = [renderer.width, renderer.height]
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
        const deltaTime = (dt * Pixi.Ticker.shared.deltaMS) / 1000
        let motionUpdated = false

        const model = this.cubismModel
        const motionManager = model.getMotionManager()
        const expressionManager = model.getExpressionManager()
        const physics = model.getPhysics()
        const pose = model.getPose()
        const breath = model.getBreath()
        const lipSync = model.getLipSync()

        model.getModel().loadParameters()
        if (motionManager.isFinished()) {
            if (this.motionRandomGroup) {
                this.playRandomMotion(this.motionRandomGroup, 1)
            }
        } else {
            motionUpdated = motionManager.updateMotion(
                model.getModel(),
                deltaTime,
            )
        }
        model.getModel().saveParameters()

        if (this.viewportSize) {
            const dragX = this.lookAtPoint
                ? ((this.lookAtPoint[0] - this.viewportSize[0] / 2) /
                      this.viewportSize[0]) *
                  2
                : 0
            const dragY = this.lookAtPoint
                ? ((this.viewportSize[1] / 2 - this.lookAtPoint[1]) /
                      this.viewportSize[1]) *
                  2
                : 0

            model
                .getModel()
                .addParameterValueById(this.idParamAngleX, dragX * 30)
            model
                .getModel()
                .addParameterValueById(this.idParamAngleY, dragY * 30)
            model
                .getModel()
                .addParameterValueById(this.idParamAngleZ, dragX * dragY * -30)

            model
                .getModel()
                .addParameterValueById(this.idParamBodyAngleX, dragX * 10)

            model.getModel().addParameterValueById(this.idParamEyeBallX, dragX)
            model.getModel().addParameterValueById(this.idParamEyeBallY, dragY)
        }

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

        if (breath && this.isBreathing) {
            breath.updateParameters(model.getModel(), deltaTime)
        }

        if (physics) {
            physics.evaluate(model.getModel(), deltaTime)
        }

        if (lipSync) {
            const value = this.lipSyncOpen

            for (let i = 0; i < this.lipSyncIds.getSize(); ++i) {
                model
                    .getModel()
                    .addParameterValueById(this.lipSyncIds.at(i), value)
            }
        }

        if (pose) {
            pose.updateParameters(model.getModel(), deltaTime)
        }

        for (const parameter in this.parameterValues) {
            const id = live2dcubismframework.CubismFramework.getIdManager().getId(
                parameter,
            )
            model
                .getModel()
                .setParameterValueById(
                    id,
                    this.parameterValues[parameter].target,
                    this.parameterValues[parameter].weight,
                )
        }

        model.getModel().update()
    }
}
