module programmer {
    requires javafx.controls;
	requires javafx.fxml;
	requires javafx.graphics;
    requires com.google.common;
	requires com.google.guice;

	opens org.dc801.programmer.controllers to javafx.fxml;

	exports org.dc801.programmer;
	exports org.dc801.programmer.controllers;
	exports org.dc801.programmer.service;
	exports org.dc801.programmer.service.impl;
	exports org.dc801.programmer.events;
}
