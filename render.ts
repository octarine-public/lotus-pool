/** What every pool's own surface is keyed by, ahead of the pool's number. */
const PREFIX = "lotus-pool:"
const layer = MenuSDK.EPanelLayer.World
let count = 0

/**
 * The surface one pool's chip draws on, and nothing else does. A chip that has not changed is
 * held as it was drawn and only moved with its pool on screen, which takes a surface of its own:
 * the camera moves every pool across the screen by a different amount.
 */
export class ChipSurface {
	public readonly Surface: MenuSDK.CHudSurface
	private readonly key = PREFIX + count++

	constructor() {
		this.Surface = MenuSDK.HudSurfaceOf(this.key, layer)
	}
	/** Takes the surface off the host for good, for a pool the game is done with. */
	public Drop() {
		MenuSDK.DropHudSurface(this.key)
	}
}
