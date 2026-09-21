import { surface } from "../render"
import { MenuManager } from "./menu"

/** What the pool is doing, which decides the colour the chip wears and what it reads. */
export const enum LotusState {
	/** The next lotus is on its way: the chip counts down to it. */
	Waiting,
	/** The pool holds every lotus it can: nothing to count until one is taken. */
	Full
}

/** How many lotuses a pool holds at most; a full pool grows no more until one is taken. */
export const MaxStacks = 6

/**
 * The chip a pool wears in the world, in dp at the slider's middle: the card the menu's own
 * panels wear - its glass, its hairline rim, its frost and its halo, whatever the theme set - washed
 * in the colour of the pool's state, the lotus and the time left, with the count of lotuses at the
 * flower's shoulder. The slider scales the whole thing about {@link SIZE_BASE}.
 */
const HEIGHT = 32
/**
 * The corner, in dp: the menu's own card radius, which carries the theme's radius scale with it,
 * held to a pill so a wide radius on a low chip never turns its corners inside out.
 */
const RADIUS = Math.min(MenuSDK.HudCardRadius, HEIGHT / 2)
const PAD = 5
/**
 * The room the reading keeps to the rim on its side, wider than {@link PAD}: the artwork carries a
 * margin of its own inside its box, and a reading set as close to the rim as the box is looked
 * jammed against it beside the flower's breathing room.
 */
const PAD_TEXT = 10
const GAP = 8
const GLYPH = 26
const FONT = 13
/** The count at the flower's shoulder: half the room it is centred in, and the size it is read at. */
const COUNT_RADIUS = 7
const COUNT_FONT = 12
const WEIGHT = MenuSDK.HudBold
/** How deep the glass is washed in the tint over the theme's own colour, out of 255. */
const TINT = 36
/** How dark the outline under the time is cut, 0 to 1: enough to hold on a lit wall, not a black rim. */
const OUTLINE = 0.5
/** The slider value the chip is drawn at 1:1 on; every notch is a twelfth either way. */
const SIZE_BASE = 4
const SIZE_STEP = 12
/** How long the plate takes to turn most of the way to the colour of a new state, in ms. */
const RECOLOR_MS = 160
/**
 * How long the reading takes to come most of the way in, or to go back out, in ms: the plate opens
 * under it as it fades in, and closes over it as it fades out, rather than the chip jumping a
 * word wider or narrower on the frame the reading started or stopped.
 */
const REVEAL_MS = 80
/** The minimap's name for the pool. */
const MINIMAP_ICON = "lotuspool"
/** The lotus the HUD's own timer wears, which the chip wears the way a bar wears a portrait. */
export const GlyphPath = `${PathData.ImagePath}/hud/timer/lotus_png.vtex_c`

/** The colour the chip is known by in each state. */
const WaitingTint = new Color(238, 150, 205)
const FullTint = new Color(96, 220, 120)

export function StateTint(state: LotusState) {
	return state === LotusState.Full ? FullTint : WaitingTint
}

export class GUI {
	/**
	 * How many cards this frame has carved so far, over every pool. Cards carved by one and the
	 * same shader string share a decorator instance in RmlUi, so each one on the surface has to be
	 * handed a step of its own; the step is invisible.
	 */
	private static carved = 0
	private lastFrame = -1
	/** The colour the chip wears this frame, on its way to the colour of the current state. */
	private readonly tint = new Color()
	private tinted = false
	/**
	 * How much of the reading is there, 0 to 1: the room the plate keeps for it and how strongly it
	 * is drawn. It eases up as a reading starts and back down once it has stopped.
	 */
	private reveal = 0
	/** The last reading the chip had, kept while it fades out so the glyphs and the room stay. */
	private shown = ""
	private readonly anchor = new Vector3()
	private readonly box = new Rectangle()
	private readonly pos = new Vector2()
	private readonly size = new Vector2()
	/** A frame is starting: no card has been carved on the surface yet. */
	public static BeginFrame() {
		GUI.carved = 0
	}

	public DrawWorld(
		origin: Vector3,
		lift: number,
		state: LotusState,
		stacks: number,
		remaining: number,
		menu: MenuManager
	) {
		const now = hrtime(),
			dt = this.lastFrame < 0 ? 0 : now - this.lastFrame
		this.lastFrame = now
		this.recolor(MenuSDK.HudColors.readable(StateTint(state)), dt)

		// the chip stands over the pool, halfway up to where its health bar would be
		this.anchor.CopyFrom(origin).AddScalarZ(lift)
		const w2s = RendererSDK.WorldToScreen(this.anchor)
		if (w2s === undefined || GUIInfo.Contains(w2s)) {
			return
		}
		const k = (menu.Size.value + SIZE_STEP) / (SIZE_BASE + SIZE_STEP),
			text = this.reading(state, remaining, menu)
		if (text.length !== 0) {
			this.shown = text
		}
		this.approach(text.length === 0 ? 0 : 1, dt)

		// the card is laid out at the world scale, so the menu's own scale does not resize it
		MenuSDK.setHudWorldScale(k)
		const height = MenuSDK.hudH(HEIGHT),
			pad = MenuSDK.hudW(PAD),
			padText = MenuSDK.hudW(PAD_TEXT),
			gap = MenuSDK.hudW(GAP),
			glyph = MenuSDK.hudH(GLYPH),
			// digits are measured as zeroes so a ticking reading does not make the chip breathe
			textW =
				this.shown.length === 0
					? 0
					: MenuSDK.HudText.Width(this.shown, FONT, WEIGHT),
			// the reading brings its own wider margin with it, so a chip without one stays a square plate
			slot = this.reveal * (gap + textW + padText - pad),
			width = Math.round(pad + glyph + slot + pad),
			x = Math.round(w2s.x - width / 2),
			y = Math.round(w2s.y - height / 2),
			centerY = y + height / 2

		MenuSDK.SetActiveSurface(surface)
		try {
			this.plate(x, y, width, height)
			const glyphX = x + pad,
				glyphY = Math.round(centerY - glyph / 2)
			this.pos.SetVector(glyphX, glyphY)
			this.size.SetVector(glyph, glyph)
			MenuSDK.HudCard.Image(
				GlyphPath,
				this.pos,
				this.size,
				Color.WhiteReadonly,
				255
			)
			if (this.reveal > 0 && textW > 0) {
				// the reading slides out from under the glyph as the plate opens, fading in as it
				// goes, and back under it as the plate closes
				MenuSDK.SetHudAlphaScale(this.reveal * this.reveal)
				MenuSDK.HudText.Center(
					x + width - padText - textW,
					centerY,
					textW,
					this.shown,
					FONT,
					// the readings are white; the state's colour stays on the glass
					Color.WhiteReadonly,
					WEIGHT,
					MenuSDK.EHudTextEffect.Outline,
					undefined,
					OUTLINE
				)
				MenuSDK.SetHudAlphaScale(1)
			}
			if (stacks > 0) {
				this.count(stacks, glyphX + glyph, glyphY)
			}
		} finally {
			MenuSDK.SetActiveSurface(undefined)
		}
	}
	public DrawOnMinimap(origin: Vector3, stacks: number, serial: number) {
		MinimapSDK.DrawIcon(
			MINIMAP_ICON,
			origin,
			195,
			stacks !== 0 ? Color.Aqua : Color.Red,
			0,
			this.getMinimapKey(serial)
		)
	}
	public Destroy(serial: number) {
		MinimapSDK.DeleteIcon(this.getMinimapKey(serial))
	}
	/**
	 * The plate under the chip: the menu's own card, so the glass, the rim, the blur and the halo are
	 * whatever the theme dresses its panels in, with the state's colour washed over the glass.
	 */
	private plate(x: number, y: number, w: number, h: number) {
		const radius = MenuSDK.hudRadius(RADIUS)
		this.box.pos1.SetVector(x, y)
		this.box.pos2.SetVector(x + w, y + h)
		MenuSDK.HudCard.Frame(this.box, 255, RADIUS, GUI.carved++)
		MenuSDK.HudCard.Plate(x, y, w, h, radius, this.tint, MenuSDK.hudAlpha(TINT))
	}
	/**
	 * How many lotuses the pool holds, written at the flower's shoulder in white and cut out against
	 * the artwork under it: the one number a pool is worth reading at a glance, kept off the reading
	 * so the time stays a time.
	 */
	private count(stacks: number, cornerX: number, cornerY: number) {
		const radius = MenuSDK.hudH(COUNT_RADIUS),
			cx = cornerX - radius / 2,
			cy = cornerY + radius / 2
		MenuSDK.HudText.Center(
			cx - radius,
			cy,
			radius * 2,
			stacks.toString(),
			COUNT_FONT,
			Color.WhiteReadonly,
			WEIGHT,
			MenuSDK.EHudTextEffect.Outline,
			undefined,
			OUTLINE
		)
	}
	/** Eases {@link GUI.reveal} part of the way to `target`, and snaps the last hair of it. */
	private approach(target: number, dt: number) {
		if (this.reveal === target) {
			return
		}
		this.reveal += (target - this.reveal) * Math.min(dt / REVEAL_MS, 1)
		if (Math.abs(target - this.reveal) < 0.01) {
			this.reveal = target
		}
	}
	/**
	 * What the chip reads: the time left to the next lotus, or nothing while the pool is full and
	 * nothing is coming. The wait is minutes long and is read the way the menu asks.
	 */
	private reading(state: LotusState, remaining: number, menu: MenuManager) {
		if (state === LotusState.Full || remaining <= 0) {
			return ""
		}
		return menu.FormatTime.value
			? Math.formatTime(remaining)
			: remaining.toFixed(remaining > 1 ? 0 : 1)
	}
	/** Turns the chip's colour part of the way to `target`, or all of it on the first frame. */
	private recolor(target: Color, dt: number) {
		if (!this.tinted) {
			this.tint.CopyFrom(target)
			this.tinted = true
			return
		}
		if (this.tint.Equals(target)) {
			return
		}
		const at = Math.min(dt / RECOLOR_MS, 1)
		this.tint.SetColor(
			Math.round(this.tint.r + (target.r - this.tint.r) * at),
			Math.round(this.tint.g + (target.g - this.tint.g) * at),
			Math.round(this.tint.b + (target.b - this.tint.b) * at),
			255
		)
	}
	private getMinimapKey(serial: number) {
		return `minimap_lotus_pool_${serial}`
	}
}
