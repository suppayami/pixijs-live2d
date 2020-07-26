import { Live2DCubismFramework as cubismusermodel } from '../cubism-sdk/Framework/dist/model/cubismusermodel'
import { Live2DCubismFramework as cubismeyeblink } from '../cubism-sdk/Framework/dist/effect/cubismeyeblink'
import { Live2DCubismFramework as cubismbreath } from '../cubism-sdk/Framework/dist/effect/cubismbreath'

export class Live2DInternalModel extends cubismusermodel.CubismUserModel {
    public getExpressionManager() {
        return this._expressionManager
    }

    public getMotionManager() {
        return this._motionManager
    }

    public getPhysics() {
        return this._physics
    }

    public getPose() {
        return this._pose
    }

    public setEyeBlink(eyeBlink: cubismeyeblink.CubismEyeBlink) {
        this._eyeBlink = eyeBlink
    }

    public getEyeBlink() {
        return this._eyeBlink
    }

    public setBreath(breath: cubismbreath.CubismBreath) {
        this._breath = breath
    }

    public getBreath() {
        return this._breath
    }

    public getLipSync() {
        return this._lipsync
    }
}
