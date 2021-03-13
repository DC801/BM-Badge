package org.dc801.programmer.events;

import javafx.scene.control.Button;

public class ProgramButtonEvent {

	private Button button;
	private boolean disable;

	public ProgramButtonEvent(Button button, boolean disable){
		this.button = button;
		this.disable = disable;
	}

	public Button getButton() {
		return button;
	}

	public boolean isDisable() {
		return disable;
	}

}
