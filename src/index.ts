import "./translations"

import { MenuManager } from "./menu"

const bootstrap = new (class CLotusPool {
	private readonly menuManager = new MenuManager()
})()
