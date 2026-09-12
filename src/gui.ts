import { canvas } from "../render"
import { ModeImage } from "./enum"
import { MenuManager } from "./menu"

export class LotusPoolGUI {
	private readonly baseSize = 22
	private readonly sleeper = new Sleeper()
	private readonly position = new Rectangle()
	private readonly baseBoxSize = new Vector2()
	private readonly minimapKeyName = "minimap_lotus_pool"

	private readonly image = PathData.ImagePath + "/hud/timer/lotus_png.vtex_c"
	private readonly basePath = "github.com/octarine-public/lotus-pool"
	private readonly background = this.basePath + "/scripts_files/images/background.png"

	protected get SpawnTime() {
		if (Dota2SDK.GameRules === undefined) {
			return 0
		}
		const spawn = 180
		return Dota2SDK.GameRules.GameMode === DOTAGameMode.DOTA_GAMEMODE_TURBO
			? spawn / 2
			: spawn
	}

	protected get ModuleTime() {
		return (Dota2SDK.GameRules?.GameTime ?? 0) % Math.floor(this.SpawnTime)
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

		canvas.Image(this.background, position.pos1, position.Size, {
			color: Color.White,

			circle: isCircle
		})

		canvas.Image(this.image, position.pos1, position.Size, {
			color: Color.White,

			circle: isCircle
		})

		if (stackCount >= 6) {
			this.DrawStackCount(stackCount, isCircle, true, width)
			return
		}

		const remainingTime = this.RemainingTime
		if (!remainingTime) {
			return
		}

		const ratio = Math.max(100 * (remainingTime / this.SpawnTime), 0)
		this.OutlineMode(isCircle, position, width, Color.Black)

		if (isCircle) {
			canvas.Circle(position.pos1, position.Size, {
				color: Color.fromUint32(0),
				borderColor: Color.Green,
				borderWidth: width,
				start: 270,
				sweep: -ratio * 3.6
			})
		} else {
			const sweep = Math.clamp(-ratio, -100, 100) * 3.6
			canvas.Rect(position.pos1.AddScalar(-1), position.Size.AddScalar(2), {
				color: Color.fromUint32(0),
				borderColor: Color.Green,
				borderWidth: 3,
				start: 270,
				sweep: sweep < 0 ? sweep + 360 : sweep
			})
		}

		const remainingText = this.GetRemainingText(remainingTime, menu.FormatTime.value)
		canvas.TextIn(remainingText, position, {
			color: Color.White,
			size: position.Height / 2.66 + 4
		})

		this.DrawStackCount(stackCount)
	}

	public GameEnded(arr: Modifier[]) {
		this.deleteIcons(arr)
		this.sleeper.FullReset()
	}

	public MenuChanged(menu: MenuManager, arr: Modifier[]) {
		if (!menu.State.value) {
			this.deleteIcons(arr)
		}
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
		this.sleeper.Sleep(7000, keyName)
	}

	public DeleteIconMinimap(modifier: Modifier) {
		MinimapSDK.DeleteIcon(this.keyName(modifier.SerialNumber))
	}

	public DrawOnMinimap(origin: Vector3, stackCount: number, serial: number) {
		const color = stackCount !== 0 ? Color.Aqua : Color.Red
		MinimapSDK.DrawIcon("lotuspool", origin, 195, color, 0, this.keyName(serial))
	}

	protected DrawStackCount(
		stackCount: number,
		isCircle = false,
		isFullStack = false,
		width = 0
	) {
		if (isFullStack) {
			const pos = this.position
			canvas.TextIn(stackCount.toString(), pos, {
				color: Color.White,
				size: pos.Height / 2.66 + 4
			})
			this.OutlineMode(isCircle, pos, width, Color.Green)
			return
		}
		if (!stackCount) {
			return
		}
		const icon = ImageData.Icons.softedge_circle_sharp
		const position = this.position.Clone()
		position.SubtractY(position.Height / 2)
		canvas.Image(icon, position.pos1, position.Size, { color: Color.Black.SetA(120) })
		canvas.TextIn(stackCount.toString(), position, {
			color: Color.White,
			size: position.Height / 2.66 + 4
		})
	}

	protected OutlineMode(
		isCircle: boolean,
		position: Rectangle,
		outlined: number,
		color: Color
	) {
		if (isCircle) {
			canvas.Circle(position.pos1, position.Size, {
				color: Color.fromUint32(0),
				borderColor: color,
				borderWidth: outlined
			})
			return
		}
		canvas.Rect(position.pos1.AddScalar(-1), position.Size.AddScalar(2), {
			color: Color.fromUint32(0),
			borderColor: color,
			borderWidth: outlined
		})
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
				? Math.formatTime(remaining)
				: Math.ceil(remaining).toFixed()
		}
		return remaining.toFixed(remaining < 2 ? 1 : 0)
	}

	private keyName(serial: number) {
		return `${this.minimapKeyName}_${serial}`
	}

	private deleteIcons(arr: Modifier[]) {
		for (let i = arr.length - 1; i > -1; i--) {
			this.DeleteIconMinimap(arr[i])
		}
	}
}
