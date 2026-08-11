import "./translations"

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
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
		EventsSDK.on("ModifierCreated", this.ModifierCreated.bind(this))
		EventsSDK.on("ModifierRemoved", this.ModifierRemoved.bind(this))
		this.menu.MenuChanged(() => this.gui.MenuChanged(this.menu, this.modifiers))
	}

	public get IsPostGame() {
		return (
			Dota2SDK.GameRules === undefined ||
			Dota2SDK.GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
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
			this.gui.DrawOnMinimap(position, modifier.StackCount, modifier.SerialNumber)
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
			this.gui.DeleteIconMinimap(modifier)
		}
	}
	protected GameEnded() {
		this.gui.GameEnded(this.modifiers)
	}
	private isValidParent(modifier: Modifier) {
		return (
			modifier.Parent instanceof MangoTree || modifier.Caster instanceof LotusPool
		)
	}
})()
