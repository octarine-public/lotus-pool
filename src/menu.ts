import { LotusIcons } from "./icons"

/** The options the notification row lists, in the order it lists them. */
const channelNames = ["Game chat", "Side card", "Disable"]

/** The channel each option stands for, under the same index; "Disable" stands for none. */
const channelsOfOption: readonly Nullable<NotificationChannel>[] = [
	NotificationChannel.Chat,
	NotificationChannel.Side,
	undefined
]

export class MenuManager {
	public static Menu: MenuManager

	public readonly State: Menu.Toggle
	/** Where the notice of a coming lotus goes: the game chat, a side card, or nowhere. */
	public readonly Notification: Menu.Dropdown
	public readonly NotifyMinimap: Menu.Toggle
	/** The game time, in minutes, the alerts fall silent at. */
	public readonly Silence: Menu.Slider
	public readonly FormatTime: Menu.Toggle
	public readonly Size: Menu.Slider

	private readonly tree = Menu.AddEntry("Visual")
	private readonly node = this.tree.AddNode(
		"Lotus pool",
		LotusIcons.Lotus,
		"Timers and stacks of the lotus pools,\nover the pool and on the minimap"
	)

	constructor() {
		this.node.SortNodes = false
		// the rows renamed since the first release keep their saved values
		this.migrate(this.node.entry.stored)
		MenuSDK.AddConfigMigration(raw =>
			this.migrate(MenuSDK.ConfigSubtreeOf(raw, this.node.entry))
		)

		// the script's own switch rides the top bar beside the breadcrumb and gates the page
		this.State = this.node.AddToggle("State", true)
		this.State.IconPath = LotusIcons.State
		this.node.HeaderControl = this.State
		this.node.Gate = this.State

		this.Notification = this.node.AddDropdown(
			"Notification",
			[...channelNames],
			channelsOfOption.indexOf(NotificationChannel.Side),
			"Where to announce the lotus\n20 seconds before it spawns"
		)
		this.Notification.IconPath = LotusIcons.Notification

		this.NotifyMinimap = this.node.AddToggle(
			"Minimap alert",
			true,
			"Also pings the minimap and plays a sound\n20 seconds before the lotus spawns"
		)
		this.NotifyMinimap.IconPath = LotusIcons.Alert

		this.Silence = this.node.AddSlider(
			"Alerts until",
			10,
			5,
			60,
			0,
			"The game time the alerts stop at,\nin minutes"
		)
		this.Silence.IconPath = LotusIcons.Silence

		this.FormatTime = this.node.AddToggle(
			"Format time",
			true,
			"Show remaining\ntime as min:sec"
		)
		this.FormatTime.IconPath = LotusIcons.FormatTime

		// the chip is drawn 1:1 at the middle of the range; the old 0-60 additional size does not carry over
		this.Size = this.node.AddSlider(
			"Size in world",
			4,
			0,
			8,
			0,
			"Size of the chip drawn over the pool"
		)
		this.Size.IconPath = LotusIcons.Size

		MenuManager.Menu = this
	}

	/** The channel the coming lotus is announced on, or nothing while the row is on "Disable". */
	public get Channel(): Nullable<NotificationChannel> {
		return channelsOfOption[this.Notification.SelectedID]
	}

	private migrate(stored: Nullable<MenuSDK.ConfigObject>) {
		MenuSDK.RenameStoredRow(stored, "Ping on minimap", "Minimap alert")
		MenuSDK.RenameStoredRow(stored, "Disable pings (by time)", "Alerts until")
	}
}
