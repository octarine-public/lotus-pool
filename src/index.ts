import "./translations"

import {
	DOTAGameState,
	EventsSDK,
	GameRules,
	LotusPool,
	MangoTree,
	Modifier
} from "github.com/octarine-public/wrapper/index"

import { LotusPoolGUI } from "./gui"
import { MenuManager } from "./menu"

new (class CLotusPool {
	private readonly gui = new LotusPoolGUI()
	private readonly menu = new MenuManager()

	private readonly modifiers: Modifier[] = []
	private readonly modName = [
		"modifier_passive_mango_tree",
		"modifier_passive_lotus_pool"
	]

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("GameEnded", this.GameChanged.bind(this))
		EventsSDK.on("ModifierCreated", this.ModifierCreated.bind(this))
		EventsSDK.on("ModifierRemoved", this.ModifierRemoved.bind(this))
	}

	public get IsPostGame() {
		return (
			GameRules === undefined ||
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}
	public Draw() {
		if (!this.menu.State.value || this.IsPostGame) {
			return
		}
		const menu = this.menu
		for (let i = this.modifiers.length - 1; i > -1; i--) {
			const modifier = this.modifiers[i]
			const owner = modifier.Parent,
				caster = modifier.Caster
			if (owner === undefined || caster === undefined) {
				continue
			}
			const isLotusPool = caster instanceof LotusPool,
				position = isLotusPool ? caster.Position : owner.Position,
				barOffset = isLotusPool ? caster.HealthBarOffset : owner.HealthBarOffset
			// notification mini map & sound event
			this.gui.SentNotification(position, menu)
			this.gui.Draw(position, modifier.StackCount, barOffset, menu)
		}
	}
	protected ModifierCreated(modifier: Modifier) {
		if (!this.modName.includes(modifier.Name)) {
			return
		}
		if (this.isValidParent(modifier)) {
			this.modifiers.push(modifier)
		}
	}
	protected ModifierRemoved(modifier: Modifier) {
		if (!this.modName.includes(modifier.Name)) {
			return
		}
		if (this.isValidParent(modifier)) {
			this.modifiers.remove(modifier)
		}
	}
	protected GameChanged() {
		this.gui.GameChanged()
		this.menu.GameChanged()
	}
	private isValidParent(modifier: Modifier) {
		return (
			modifier.Parent instanceof MangoTree || modifier.Caster instanceof LotusPool
		)
	}
})()
