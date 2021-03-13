package org.dc801.programmer.events;

import javafx.scene.paint.Color;
import org.dc801.programmer.ProgrammerStatus;

public class ProgramStatusEvent {

	ProgrammerStatus statusLabel;
	String statusString;
	Color color;

	public ProgramStatusEvent(ProgrammerStatus statusLabel, String statusString, Color color){
		this.statusLabel = statusLabel;
		this.statusString = statusString;
		this.color = color;
	}

	public ProgrammerStatus getStatusLabel() {
		return statusLabel;
	}

	public String getStatusString() {
		return statusString;
	}

	public Color getColor() {
		return color;
	}
}
