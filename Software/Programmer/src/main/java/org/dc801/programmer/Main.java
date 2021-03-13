package org.dc801.programmer;

import com.google.common.eventbus.EventBus;
import com.google.common.eventbus.Subscribe;
import com.google.inject.Guice;
import com.google.inject.Injector;
import javafx.application.Application;
import javafx.event.EventHandler;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.layout.Pane;
import javafx.scene.paint.Color;
import javafx.stage.Stage;

import javafx.stage.StageStyle;
import javafx.stage.WindowEvent;
import org.dc801.programmer.events.SplashCompleteEvent;
import org.dc801.programmer.service.FXMLLoaderService;

public class Main extends Application {

	Stage mainStage;

	private FXMLLoaderService fxmlLoaderService;
	private EventBus eventBus;

	@Override
	public void init(){
		// Setup the dependency injection
		final Injector injector = Guice.createInjector(new GuiceModule());
		fxmlLoaderService = injector.getInstance(FXMLLoaderService.class);
		eventBus = injector.getInstance(EventBus.class);
	}

    @Override
    public void start(Stage stage) {

		System.out.println("Startup");

		// Register to the event bus
		eventBus.register(this);

		// Load the splash and show it
		Pane splashPane = (Pane) fxmlLoaderService.load("/org/dc801/programmer/fxml/Splash.fxml");
		Scene splashScene = new Scene(splashPane, Color.TRANSPARENT);
		stage.setScene(splashScene);
		stage.initStyle(StageStyle.TRANSPARENT);
		stage.setAlwaysOnTop(true);
		stage.show();

    	// Load the main stage.  Is not shown until the splash fires the event that it is done
		final Parent root = fxmlLoaderService.load("/org/dc801/programmer/fxml/Main.fxml");
		mainStage = new Stage(StageStyle.DECORATED);
		mainStage.setTitle("DC801 Badge Programmer - " + Defines.version);
		mainStage.getIcons().add(new Image(this.getClass().getResourceAsStream("/org/dc801/programmer/style/icon.png")));
		mainStage.setScene(new Scene(root));
		mainStage.setResizable(false);
		mainStage.setMaxWidth(1024);
		mainStage.setMinWidth(1024);
		mainStage.setMaxHeight(1200);
		mainStage.sizeToScene();
		mainStage.setOnCloseRequest(new EventHandler<WindowEvent>() {
			public void handle(WindowEvent we) {
				System.out.println("Stage is closing");
				System.exit(0);
			}
		});

    }

    public static void main(String[] args) {
        launch(args);
    }


    @Subscribe
	public void handleEvent(SplashCompleteEvent event){
		mainStage.show();
	}
}
