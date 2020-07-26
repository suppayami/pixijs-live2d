import {
    Live2DCubismFramework as live2dcubismframework,
    Option,
    LogLevel,
} from '../cubism-sdk/Framework/dist/live2dcubismframework'

export { Live2DModel } from './live2d_model'

export const initCubism = () => {
    const option = new Option()
    option.logFunction = (message: string) => console.log(message)
    option.loggingLevel = LogLevel.LogLevel_Verbose
    live2dcubismframework.CubismFramework.startUp(option)
    live2dcubismframework.CubismFramework.initialize()
}
