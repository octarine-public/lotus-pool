import { GlyphPath, GUI, LotusState, MaxStacks, StateTint } from "./gui"
import { MenuManager } from "./menu"

/** How long before the lotus spawns the alerts go out, in seconds. */
const ALERT_SECONDS = 20
/** How long a ping stays on the minimap, and how long until the next one, in seconds. */
const PING_SECONDS = 7
/** How long the card of the coming lotus stays on screen, in seconds. */
const NOTICE_SECONDS = 6
/** How often a lotus grows, in seconds of game time; turbo grows them twice as fast. */
const SPAWN_SECONDS = 180

export class LotusModel {
	public static readonly Sleeper = new TickSleeper()
	/**
	 * Whether the coming lotus has been announced this cycle. Every pool runs on the one clock,
	 * so one notice covers them all; the minimap pings stay one per pool.
	 */
	private static announced = false

	public static GameEnded() {
		this.Sleeper.ResetTimer()
		this.announced = false
	}
	/** How long a lotus takes to grow in this game. */
	public static get SpawnTime() {
		if (Dota2SDK.GameRules === undefined) {
			return 0
		}
		return Dota2SDK.GameRules.GameMode === DOTAGameMode.DOTA_GAMEMODE_TURBO
			? SPAWN_SECONDS / 2
			: SPAWN_SECONDS
	}
	/** How long until the next lotus grows, on the clock every pool shares. */
	public static get Remaining() {
		const spawn = this.SpawnTime
		if (spawn <= 0) {
			return 0
		}
		return spawn - ((Dota2SDK.GameRules?.GameTime ?? 0) % spawn)
	}
	private static soundEmit(ms: number) {
		if (!this.Sleeper.Sleeping) {
			SoundSDK.EmitStartSoundEvent("General.Ping")
			this.Sleeper.Sleep(ms)
		}
	}
	/** Tells of the coming lotus on the channel the menu picked, once a cycle. */
	private static announce() {
		if (this.announced) {
			return
		}
		const channel = MenuManager.Menu.Channel
		if (channel === undefined) {
			return
		}
		this.announced = true
		NotificationsSDK.Show({
			title: Menu.Localization.Localize("Lotus pool"),
			message: Menu.Localization.Localize("Spawns in 20 seconds"),
			titleIcon: GlyphPath,
			color: StateTint(LotusState.Waiting),
			duration: NOTICE_SECONDS,
			channel
		})
	}

	private readonly gui = new GUI()
	private readonly sleeper = new TickSleeper()

	constructor(public readonly Modifier: Modifier) {}

	private get menu() {
		return MenuManager.Menu
	}
	/** The pool itself where the modifier names it, else the tree the modifier sits on. */
	private get owner(): Nullable<Unit> {
		const caster = this.Modifier.Caster
		return caster instanceof LotusPool ? caster : this.Modifier.Parent
	}
	private get stacks() {
		return this.Modifier.StackCount
	}
	private get state() {
		return this.stacks >= MaxStacks ? LotusState.Full : LotusState.Waiting
	}
	/** Whether the alerts have gone quiet for the rest of the game, by the menu's clock. */
	private get silenced() {
		const minutes = (Dota2SDK.GameRules?.GameTime ?? 0) / 60
		return minutes > this.menu.Silence.value
	}
	public Draw() {
		const owner = this.owner
		if (owner === undefined) {
			return
		}
		this.gui.DrawWorld(
			owner.Position,
			owner.HealthBarOffset / 2,
			this.state,
			this.stacks,
			LotusModel.Remaining,
			this.menu
		)
		this.gui.DrawOnMinimap(owner.Position, this.stacks, this.Modifier.SerialNumber)
	}
	public PostDataUpdate() {
		this.alert()
	}
	public Destroy() {
		this.gui.Destroy(this.Modifier.SerialNumber)
		return true
	}
	/**
	 * The alerts of the coming lotus: the notice on its channel, and on top of it the pings on
	 * the minimap. Outside the window before the spawn there is nothing to do but arm the notice
	 * for the next cycle; a full pool grows nothing, so it has nothing to announce.
	 */
	private alert() {
		if (!this.menu.State.value) {
			return
		}
		if (LotusModel.Remaining > ALERT_SECONDS) {
			LotusModel.announced = false
			return
		}
		if (this.state === LotusState.Full || this.silenced) {
			return
		}
		LotusModel.announce()
		this.pingMinimap()
	}
	private pingMinimap() {
		if (!this.menu.NotifyMinimap.value || this.sleeper.Sleeping) {
			return
		}
		const owner = this.owner
		if (owner === undefined) {
			return
		}
		const rawTime = GameState.RawGameTime
		MinimapSDK.DrawPing(owner.Position, Color.White, rawTime + PING_SECONDS)
		this.sleeper.Sleep(PING_SECONDS * 1000)
		LotusModel.soundEmit(PING_SECONDS * 1000)
	}
}
