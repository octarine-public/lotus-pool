import {
	ImageData,
	Menu,
	NotificationsSDK,
	ResetSettingsUpdated,
	Sleeper
} from "github.com/octarine-public/wrapper/index"

export class MenuManager {
	public readonly Size: Menu.Slider
	public readonly State: Menu.Toggle
	public readonly FormatTime: Menu.Toggle
	public readonly PingMiniMap: Menu.Toggle
	public readonly ModeImage: Menu.Dropdown
	public readonly DisableNotificationTime: Menu.Slider

	private readonly tree: Menu.Node
	private readonly visual = Menu.AddEntry("Visual")

	private readonly reset: Menu.Button
	private readonly sleeper = new Sleeper()
	private readonly lotusImage = ImageData.Paths.ItemIcons + "/famango_png.vtex_c"

	constructor() {
		this.tree = this.visual.AddNode("Lotus pool", this.lotusImage, "", 0)
		this.tree.SortNodes = false

		this.State = this.tree.AddToggle(
			"State",
			true,
			"Full turn off or turn on pool lotuses"
		)

		this.FormatTime = this.tree.AddToggle(
			"Format time",
			true,
			"Show cooldown\nformat time (min:sec)",
			-1,
			ImageData.Paths.Icons.icon_svg_format_time
		)

		this.PingMiniMap = this.tree.AddToggle(
			"Ping on minimap",
			true,
			"Show pings on minimap\nuntil new lotuses appear (only you see)"
		)

		this.DisableNotificationTime = this.tree.AddSlider(
			"Disable pings (by time)",
			10,
			5,
			60,
			0,
			"Disable minimap pings\nafter (x) game time (minutes)"
		)

		this.Size = this.tree.AddSlider(
			"Additional size",
			22,
			0,
			60,
			0,
			"Additional timer size and icon image"
		)

		this.ModeImage = this.tree.AddDropdown("Mode images", ["Circle", "Square"])

		this.reset = this.tree.AddButton("Reset settings")
		this.reset.OnValue(() => this.ResetSettings())

		this.PingMiniMap.OnValue(call => {
			this.DisableNotificationTime.IsHidden = !call.value
			this.tree.Update()
		})
	}

	public ResetSettings() {
		if (!this.sleeper.Sleeping("ResetSettings")) {
			this.resetValues()
			this.tree.Update()
			NotificationsSDK.Push(new ResetSettingsUpdated())
			this.sleeper.Sleep(2 * 1000, "ResetSettings")
		}
	}

	public GameChanged() {
		this.sleeper.FullReset()
	}

	private resetValues() {
		this.Size.value = this.Size.defaultValue
		this.State.value = this.State.defaultValue
		this.FormatTime.value = this.FormatTime.defaultValue
		this.PingMiniMap.value = this.PingMiniMap.defaultValue
		this.ModeImage.SelectedID = this.ModeImage.defaultValue
		this.DisableNotificationTime.value = this.DisableNotificationTime.defaultValue
	}
}
