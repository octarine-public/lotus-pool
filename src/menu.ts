
export class MenuManager {
	public readonly Size: Menu.Slider
	public readonly State: Menu.Toggle
	public readonly FormatTime: Menu.Toggle
	public readonly PingMiniMap: Menu.Toggle
	public readonly ModeImage: Menu.Dropdown
	public readonly DisableNotificationTime: Menu.Slider

	private readonly tree: Menu.Node
	private readonly visual = Menu.AddEntry("Visual")
	private readonly lotusImage = PathData.ImagePath + "/hud/timer/lotus_png.vtex_c"

	constructor() {
		this.tree = this.visual.AddNode("Lotus pool", this.lotusImage)
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
			ImageData.Icons.icon_svg_format_time
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

		this.PingMiniMap.OnValue(call => {
			this.DisableNotificationTime.IsHidden = !call.value
			this.tree.Update()
		})
	}

	public MenuChanged(callback: () => void) {
		this.State.OnValue(() => callback())
		this.FormatTime.OnValue(() => callback())
		this.PingMiniMap.OnValue(() => callback())
		this.DisableNotificationTime.OnValue(() => callback())
		this.Size.OnValue(() => callback())
		this.ModeImage.OnValue(() => callback())
	}
}
