import "./translations"

import {
	DOTAGameState,
	EventsSDK,
	GameRules,
	MangoTree,
	Modifier
} from "github.com/octarine-public/wrapper/index"

import { LotusPoolGUI } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class CLotusPool {
	private readonly gui = new LotusPoolGUI()
	private readonly menu = new MenuManager()

	private readonly modifiers: Modifier[] = []
	private readonly modName = "modifier_passive_mango_tree"

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
		for (let index = this.modifiers.length - 1; index > -1; index--) {
			const modifier = this.modifiers[index]
			const owner = modifier.Parent
			if (owner === undefined) {
				continue
			}
			const position = owner.Position
			// notification mini map & sound event
			this.gui.SentNotification(position, menu)
			this.gui.Draw(position, modifier.StackCount, owner.HealthBarOffset, menu)
		}
	}

	public ModifierCreated(modifier: Modifier) {
		if (modifier.Name !== this.modName) {
			return
		}
		if (modifier.Parent instanceof MangoTree) {
			this.modifiers.push(modifier)
		}
	}

	public ModifierRemoved(modifier: Modifier) {
		if (modifier.Name !== this.modName) {
			return
		}
		if (modifier.Parent instanceof MangoTree) {
			this.modifiers.remove(modifier)
		}
	}

	public GameChanged() {
		this.gui.GameChanged()
		this.menu.GameChanged()
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("GameEnded", () => bootstrap.GameChanged())

EventsSDK.on("ModifierCreated", modifier => bootstrap.ModifierCreated(modifier))

EventsSDK.on("ModifierRemoved", modifier => bootstrap.ModifierRemoved(modifier))
