/** What every pool's own surface is keyed by, ahead of the pool's number. */
const PREFIX = "lotus-pool:"
const layer = MenuSDK.EPanelLayer.World
let count = 0

/**
 * The surface one pool's chip draws on, and nothing else does. A chip that has not changed is
 * held as it was drawn, on its pool's anchor, which takes a surface of its own: a surface is held
 * whole, and every pool's chip changes at its own time.
 */
export class ChipSurface {
	private readonly key = PREFIX + count++

	/**
	 * The surface, opened afresh after {@link ChipSurface.Drop} for a pool drawn again: a dropped
	 * one is never ticked again, so the anchors it would take for the chip would never be freed.
	 */
	public get Surface(): MenuSDK.CHudSurface {
		return MenuSDK.HudSurfaceOf(this.key, layer)
	}
	/** Takes the surface off the host, for a pool the game is done with or a page switched off. */
	public Drop() {
		MenuSDK.DropHudSurface(this.key)
	}
}
