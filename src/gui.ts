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
		position: Vector3,
		stackCount: number,
		healthBarOffset: number,
		additionalSize: number,
		formatTime: boolean
	) {
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}

		const w2s = RendererSDK.WorldToScreen(
			position.Clone().AddScalarZ(healthBarOffset / 2)
		)

		if (w2s === undefined || GUIInfo.Contains(w2s)) {
			return
		}

		this.updatePositions(w2s, additionalSize)

		if (GUIInfo.Contains(this.position.pos1)) {
			return
		}

		const border = GUIInfo.ScaleHeight(4)

		RendererSDK.Image(
			this.image,
			this.position.pos1,
			0,
			this.position.Size,
			Color.White
		)

		// TODO: get max stack count
		if (stackCount >= 6) {
			RendererSDK.TextByFlags(
				stackCount.toString(),
				this.position,
				Color.White,
				2.66
			)
			RendererSDK.OutlinedCircle(
				this.position.pos1,
				this.position.Size,
				Color.Green,
				border
			)
			return
		}

		const remainingTime = this.RemainingTime
		if (!remainingTime) {
			return
		}

		RendererSDK.OutlinedCircle(
			this.position.pos1,
			this.position.Size,
			Color.Green,
			border
		)

		RendererSDK.Arc(
			-90,
			Math.max(100 * (remainingTime / this.SpawnTime), 0),
			this.position.pos1,
			this.position.Size,
			false,
			border,
			Color.Red
		)

		let remainingText = ""
		if (remainingTime > 60) {
			remainingText = formatTime
				? MathSDK.FormatTime(remainingTime)
				: Math.ceil(remainingTime).toFixed()
		} else {
			remainingText = remainingTime.toFixed(remainingTime < 2 ? 1 : 0)
		}

		RendererSDK.TextByFlags(remainingText, this.position, Color.White, 2.66)

		// draw stack count
		this.DrawStackCount(stackCount)
	}

	public GameChanged() {
		this.sleeper.FullReset()
	}

	public SentNotification(
		position: Vector3,
		statePing: boolean,
		disableByTime: number
	) {
		if (this.RemainingTime > 10) {
			return
		}
		const rawTime = GameState.RawGameTime
		const byRawTime = (rawTime - 95) / 60 <= disableByTime
		const isDisableByTime = disableByTime === 0 || byRawTime
		const keyName = position.Length2D + "_sentNotification"
		if (!statePing || !isDisableByTime || this.sleeper.Sleeping(keyName)) {
			return
		}
		SoundSDK.EmitStartSoundEvent("General.Ping")
		MinimapSDK.DrawPing(position, Color.White, rawTime + 7)
		this.sleeper.Sleep(7 * 1000, keyName)
	}

	protected DrawStackCount(stackCount: number) {
		if (!stackCount) {
			return
		}
		const icon = ImageData.Paths.Icons.softedge_circle_sharp
		const position = this.position.Clone()
		position.SubtractY(position.Height / 2)
		RendererSDK.Image(icon, position.pos1, -1, position.Size, Color.Black.SetA(120))
		RendererSDK.TextByFlags(stackCount.toString(), position, Color.White, 2.66)
	}

	private updatePositions(w2s: Vector2, additionalSize: number) {
		this.baseBoxSize.SetX(GUIInfo.ScaleWidth(this.baseSize + additionalSize))
		this.baseBoxSize.SetY(GUIInfo.ScaleHeight(this.baseSize + additionalSize))

		const position = w2s.SubtractForThis(
			this.baseBoxSize.DivideScalar(2).FloorForThis()
		)

		this.position.pos1.CopyFrom(position)
		this.position.pos2.CopyFrom(position.Add(this.baseBoxSize))
	}
}