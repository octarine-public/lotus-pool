import { Paths } from "./paths"

/** Icons of the menu: the SDK set where it has one, our own outline glyphs next to it. */
export const LotusIcons = {
	/** The page itself: the flower standing on the pool. */
	Lotus: `${Paths.Icons}/lotus.svg`,
	State: Menu.Icons.Power,
	/** The row that picks where the notice of a coming lotus goes. */
	Notification: Menu.Icons.Type,
	/** Waves going out from a point: the ping the alert puts on the minimap. */
	Alert: `${Paths.Icons}/ping.svg`,
	/** The game time the alerts fall silent at. */
	Silence: Menu.Icons.Hourglass,
	FormatTime: Menu.Icons.ClockSeconds,
	Size: Menu.Icons.Expand
} as const
