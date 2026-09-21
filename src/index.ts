import "./translations"

import { GUI } from "./gui"
import { MenuManager } from "./menu"
import { LotusModel } from "./model"

/** The modifiers a pool's lotuses are counted on: the pool's own, and the tree's in the event map. */
const modifierNames = ["modifier_passive_mango_tree", "modifier_passive_lotus_pool"]

new (class CLotusPool {
	private readonly menu!: MenuManager
	private readonly entities: LotusModel[] = []

	constructor(canBeInitialized: boolean) {
		if (!canBeInitialized) {
			return
		}
		this.menu = new MenuManager()
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
		EventsSDK.on("PostDataUpdate", this.PostDataUpdate.bind(this))

		EventsSDK.on("ModifierCreated", this.ModifierCreated.bind(this))
		EventsSDK.on("ModifierRemoved", this.ModifierRemoved.bind(this))

		// a switched-off page leaves no icons of its own on the minimap
		this.menu.State.OnValue(state => {
			if (!state.value) {
				this.clearMinimap()
			}
		})
	}
	private get isUIGame() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}
	private get isPostGame() {
		return (
			Dota2SDK.GameRules === undefined ||
			Dota2SDK.GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}
	private get shouldDraw() {
		return this.menu.State.value && this.isUIGame && !this.isPostGame
	}
	protected GameEnded() {
		LotusModel.GameEnded()
		this.clearMinimap()
	}
	protected Draw() {
		if (!this.shouldDraw) {
			return
		}
		GUI.BeginFrame()
		for (let i = this.entities.length - 1; i > -1; i--) {
			this.entities[i].Draw()
		}
	}
	protected PostDataUpdate(dt: number) {
		if (dt === 0 || this.isPostGame) {
			return
		}
		for (let i = this.entities.length - 1; i > -1; i--) {
			this.entities[i].PostDataUpdate()
		}
	}
	protected ModifierCreated(modifier: Modifier) {
		if (this.isValidModifier(modifier)) {
			this.entities.push(new LotusModel(modifier))
		}
	}
	protected ModifierRemoved(modifier: Modifier) {
		if (this.isValidModifier(modifier)) {
			this.entities.removeCallback(x => x.Modifier === modifier && x.Destroy())
		}
	}
	private isValidModifier(modifier: Modifier) {
		return (
			modifierNames.includes(modifier.Name) &&
			(modifier.Parent instanceof MangoTree || modifier.Caster instanceof LotusPool)
		)
	}
	private clearMinimap() {
		for (let i = this.entities.length - 1; i > -1; i--) {
			this.entities[i].Destroy()
		}
	}
})(true)
