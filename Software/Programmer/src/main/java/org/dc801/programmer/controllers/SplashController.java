package org.dc801.programmer.controllers;

import com.google.common.eventbus.EventBus;
import com.google.inject.Inject;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;
import org.dc801.programmer.events.SplashCompleteEvent;
import org.dc801.programmer.service.FXMLLoaderService;

/**
 * Controller for the splash screen
 */
public class SplashController {

	private final FXMLLoaderService fxmlLoaderService;
	private final EventBus eventBus;

	@FXML private Pane splashpane;

	@Inject
	public SplashController(final FXMLLoaderService fxmlLoaderService,
							final EventBus eventBus){
		this.fxmlLoaderService = fxmlLoaderService;
		this.eventBus = eventBus;
	}

	/**
	 * Initialize the panel
	 */
	@FXML
	public void initialize(){

		// Setup a task to close the splash in 2 seconds and send an event about it
		// The main controller is shown after the splash closes
		final Task closeTask = new Task() {
			@Override
			protected Object call() throws Exception {

				Thread.sleep(2000);

				Platform.runLater(() -> {
					final Stage stage = (Stage) splashpane.getScene().getWindow();
					stage.close();
					eventBus.post(new SplashCompleteEvent());
				});
				return null;
			}
		};

		new Thread(closeTask).start();

	}

}
