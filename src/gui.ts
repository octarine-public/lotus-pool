import {
	Color,
	DOTAGameMode,
	DOTAGameUIState,
	GameRules,
	GameState,
	GUIInfo,
	ImageData,
	MathSDK,
	MinimapSDK,
	Rectangle,
	RendererSDK,
	Sleeper,
	SoundSDK,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/index"

import { ModeImage } from "./enum"
import { MenuManager } from "./menu"

export class LotusPoolGUI {
	private readonly baseSize = 22
	private readonly sleeper = new Sleeper()
	private readonly position = new Rectangle()
	private readonly baseBoxSize = new Vector2()

	// todo from menu
	private readonly image = ImageData.Paths.ItemIcons + "/famango_png.vtex_c"

	protected get SpawnTime() {
		if (GameRules === undefined) {
			return 0
		}
		const spawn = 3 * 60 // every 3 min
		return GameRules.GameMode === DOTAGameMode.DOTA_GAMEMODE_TURBO ? spawn / 2 : spawn
	}

	protected get ModuleTime() {
		return (GameRules?.GameTime ?? 0) % Math.floor(this.SpawnTime)
	}

	protected get RemainingTime() {
		return this.SpawnTime - this.ModuleTime
	}

	public Draw(
		origin: Vector3,
		stackCount: number,
		healthBarOffset: number,
		menu: MenuManager
	) {
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}
		const originOffset = origin.Clone().AddScalarZ(healthBarOffset / 2)
		const w2s = RendererSDK.WorldToScreen(originOffset)
		if (w2s === undefined || GUIInfo.Contains(w2s)) {
			return
		}
		if (!this.Update(w2s, menu.Size.value)) {
			return
		}

		const position = this.position
		const border2x2 = GUIInfo.ScaleHeight(2)
		const width = Math.round(border2x2 + Math.round(position.Height / 15))
		const isCircle = menu.ModeImage.SelectedID === ModeImage.Round

		// image lotus
		RendererSDK.Image(
			this.image,
			position.pos1,
			isCircle ? 0 : -1,
			position.Size,
			Color.White
		)

		// TODO: get max stack count
		if (stackCount >= 6) {
			// draw stack count
			this.DrawStackCount(stackCount, isCircle, true, width)
			return
		}

		const remainingTime = this.RemainingTime
		if (!remainingTime) {
			return
		}

		const ratio = Math.max(100 * (remainingTime / this.SpawnTime), 0)
		this.OutlineMode(isCircle, position, width, Color.Green)

		if (isCircle) {
			RendererSDK.Arc(
				-90,
				ratio,
				position.pos1,
				position.Size,
				false,
				width,
				Color.Red
			)
		} else {
			RendererSDK.Radial(
				-90,
				ratio,
				position.pos1,
				position.Size,
				Color.Red.SetA(75)
			)
		}

		const remainingText = this.GetRemainingText(remainingTime, menu.FormatTime.value)
		RendererSDK.TextByFlags(remainingText, position, Color.White, 2.66)

		// draw stack count
		this.DrawStackCount(stackCount)
	}

	public GameChanged() {
		this.sleeper.FullReset()
	}

	public SentNotification(origin: Vector3, menu: MenuManager) {
		if (this.RemainingTime > 10) {
			return
		}
		const statePing = menu.PingMiniMap.value,
			disableByTime = menu.DisableNotificationTime.value
		const rawTime = GameState.RawGameTime,
			byRawTime = (rawTime - 95) / 60 <= disableByTime,
			isDisableByTime = disableByTime === 0 || byRawTime
		const keyName = origin.Length2D + "_sentNotification"
		if (!statePing || !isDisableByTime || this.sleeper.Sleeping(keyName)) {
			return
		}
		SoundSDK.EmitStartSoundEvent("General.Ping")
		MinimapSDK.DrawPing(origin, Color.White, rawTime + 7)
		this.sleeper.Sleep(7 * 1000, keyName)
	}

	protected DrawStackCount(
		stackCount: number,
		isCircle = false,
		isFullStack = false,
		width = 0
	) {
		if (isFullStack) {
			const pos = this.position
			RendererSDK.TextByFlags(stackCount.toString(), pos, Color.White, 2.66)
			this.OutlineMode(isCircle, pos, width, Color.Green)
			return
		}
		if (!stackCount) {
			return
		}
		const icon = ImageData.Paths.Icons.softedge_circle_sharp
		const position = this.position.Clone()
		position.SubtractY(position.Height / 2)
		RendererSDK.Image(icon, position.pos1, -1, position.Size, Color.Black.SetA(120))
		RendererSDK.TextByFlags(stackCount.toString(), position, Color.White, 2.66)
	}

	protected OutlineMode(
		isCircle: boolean,
		position: Rectangle,
		outlined: number,
		color: Color
	) {
		if (isCircle) {
			RendererSDK.OutlinedCircle(position.pos1, position.Size, color, outlined)
			return
		}
		RendererSDK.OutlinedRect(position.pos1, position.Size, outlined, color)
	}

	protected Update(w2s: Vector2, additionalSize: number) {
		this.baseBoxSize.SetX(GUIInfo.ScaleWidth(this.baseSize + additionalSize))
		this.baseBoxSize.SetY(GUIInfo.ScaleHeight(this.baseSize + additionalSize))
		const position = w2s.SubtractForThis(
			this.baseBoxSize.DivideScalar(2).FloorForThis()
		)
		this.position.pos1.CopyFrom(position)
		this.position.pos2.CopyFrom(position.Add(this.baseBoxSize))
		return !GUIInfo.Contains(this.position.pos1)
	}

	protected GetRemainingText(remaining: number, formatTime: boolean) {
		if (remaining > 60) {
			return formatTime
				? MathSDK.FormatTime(remaining)
				: Math.ceil(remaining).toFixed()
		}
		return remaining.toFixed(remaining < 2 ? 1 : 0)
	}
}
