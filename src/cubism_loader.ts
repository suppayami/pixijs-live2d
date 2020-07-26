import * as Pixi from 'pixi.js'
import 'whatwg-fetch'

import { Live2DCubismFramework as icubismmodelsetting } from '../cubism-sdk/Framework/dist/icubismmodelsetting'
import { Live2DCubismFramework as cubismmodelsettingjson } from '../cubism-sdk/Framework/dist/cubismmodelsettingjson'

export interface ArrayBufferMap {
    [key: string]: ArrayBuffer
}

interface CubismResources {
    setting: icubismmodelsetting.ICubismModelSetting
    textures: Pixi.Texture[]
    modelBuffer?: ArrayBuffer
    expressions: ArrayBufferMap
    physics?: ArrayBuffer
    pose?: ArrayBuffer
}

const loadCubismTextures = async (
    dir: string,
    setting: icubismmodelsetting.ICubismModelSetting,
) =>
    new Promise<Pixi.Texture[]>((resolve) => {
        const loader = new Pixi.Loader()
        const textureCount = setting.getTextureCount()

        for (
            let modelTextureNumber = 0;
            modelTextureNumber < textureCount;
            modelTextureNumber++
        ) {
            if (setting.getTextureFileName(modelTextureNumber) == '') {
                console.log('getTextureFileName null')
                continue
            }

            const texturePath =
                dir + '/' + setting.getTextureFileName(modelTextureNumber)

            loader.add(texturePath, texturePath)
        }

        loader.load((_loader, resources) => {
            resolve(
                Object.values(resources)
                    .map((resource) => resource?.texture)
                    .filter(Boolean) as any,
            )
        })
    })

const loadCubismModelBuffer = async (
    dir: string,
    setting: icubismmodelsetting.ICubismModelSetting,
) => {
    const modelFileName = setting.getModelFileName()
    return getSingleArrayBuffer(dir, modelFileName)
}

const loadCubismExpression = async (
    dir: string,
    setting: icubismmodelsetting.ICubismModelSetting,
) => {
    if (setting.getExpressionCount() === 0) {
        return {}
    }

    const expressions: { [key: string]: ArrayBuffer } = {}
    const count: number = setting.getExpressionCount()

    for (let i = 0; i < count; i++) {
        const expressionName = setting.getExpressionName(i)
        const expressionFileName = setting.getExpressionFileName(i)

        const res = await fetch(`${dir}/${expressionFileName}`)
        const buffer = await res.arrayBuffer()

        expressions[expressionName] = buffer
    }

    return expressions
}

const loadCubismPhysics = async (
    dir: string,
    setting: icubismmodelsetting.ICubismModelSetting,
) => {
    const filename = setting.getPhysicsFileName()
    return getSingleArrayBuffer(dir, filename)
}

const loadCubismPose = async (
    dir: string,
    setting: icubismmodelsetting.ICubismModelSetting,
) => {
    const filename = setting.getPoseFileName()
    return getSingleArrayBuffer(dir, filename)
}

const getSingleArrayBuffer = async (dir: string, filename?: string) => {
    if (!filename) {
        return
    }
    const res = await fetch(`${dir}/${filename}`)
    return res.arrayBuffer()
}

export const loadCubismModel = async (
    dir: string,
    modelFileName: string,
): Promise<CubismResources> =>
    new Promise(async (resolve) => {
        const path = `${dir}/${modelFileName}`
        const res = await fetch(path)
        const buffer = await res.arrayBuffer()
        const setting = new cubismmodelsettingjson.CubismModelSettingJson(
            buffer,
            buffer.byteLength,
        )
        const textures = await loadCubismTextures(dir, setting)
        const modelBuffer = await loadCubismModelBuffer(dir, setting)
        const expressions = await loadCubismExpression(dir, setting)
        const physics = await loadCubismPhysics(dir, setting)
        const pose = await loadCubismPose(dir, setting)

        resolve({ setting, textures, modelBuffer, expressions, physics, pose })
    })
