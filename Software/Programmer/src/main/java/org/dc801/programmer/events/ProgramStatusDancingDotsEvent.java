package org.dc801.programmer.events;

import org.dc801.programmer.ProgrammerStatus;

public class ProgramStatusDancingDotsEvent {

	ProgrammerStatus statusLabel;

	public ProgramStatusDancingDotsEvent(ProgrammerStatus statusLabel){
		this.statusLabel = statusLabel;
	}

	public ProgrammerStatus getStatusLabel() {
		return statusLabel;
	}

}
