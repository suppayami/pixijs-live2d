import * as Pixi from 'pixi.js'

export class TextureManager {
    private textures: { [key: string]: WebGLTexture } = {}

    constructor(private readonly renderer: Pixi.Renderer) {}

    public async loadTexture(path: string): Promise<WebGLTexture> {
        if (this.textures[path]) {
            return this.textures[path]
        }

        return new Promise<WebGLTexture>((resolve) => {
            const gl = this.renderer.gl
            const texture = gl.createTexture()!
            const img = new Image()
            img.src = path
            img.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture)
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR_MIPMAP_LINEAR,
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR,
                )
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    img,
                )
                gl.generateMipmap(gl.TEXTURE_2D)

                // Fix flick screen
                const whiteTexture = Pixi.Texture.WHITE.baseTexture
                this.renderer.texture.bind(whiteTexture, 0)

                resolve(texture)
                this.textures[path] = texture
            }
        })
    }
}
