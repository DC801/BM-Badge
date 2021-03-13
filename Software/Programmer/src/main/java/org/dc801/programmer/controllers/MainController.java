package org.dc801.programmer.controllers;

import com.google.common.eventbus.EventBus;
import com.google.common.eventbus.Subscribe;
import com.google.inject.Inject;
import javafx.application.Platform;
import javafx.beans.value.ChangeListener;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.paint.Color;
import org.dc801.programmer.DaemonThreadFactory;
import org.dc801.programmer.ProgrammerStatus;
import org.dc801.programmer.events.*;
import org.dc801.programmer.service.FXMLLoaderService;

import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Main controller, all the UI is contained here
 */
public class MainController {

	private final FXMLLoaderService fxmlLoaderService;
	private final EventBus eventBus;

	@FXML
	private MenuItem menuitemClose;

	@FXML
	private MenuItem menuitemAbout;

	@FXML
	private Button buttonProgramAtmel;

	@FXML
	private Button buttonProgramBMD;

	@FXML
	private Button buttonProgramAll;

	@FXML
	private TextArea textareaOutput;

	@FXML
	private Label labelAtmel;

	@FXML
	private Label labelBMD;

	private DaemonThreadFactory tf = new DaemonThreadFactory();;

	@Inject
	public MainController(final FXMLLoaderService fxmlLoaderService,
							final EventBus eventBus){
		this.fxmlLoaderService = fxmlLoaderService;
		this.eventBus = eventBus;
	}

	/**
	 * Initialize the UI, run at startup
	 */
	@FXML
	public void initialize() {

		// Exit menu item
		menuitemClose.setOnAction(event -> eventBus.post(new ProgramExitEvent()));

//		// Redirect stdout stderr to the textarea output
//		OutputStream out = new OutputStream() {
//			@Override
//			public void write(int b) throws IOException {
//				textareaOutput.appendText(String.valueOf((char)b));
//			}
//		};
//
//		System.setOut(new PrintStream(out, true));
//		System.setErr(new PrintStream(out, true));

		// Setup the log output to auto scroll and word wrap
		textareaOutput.textProperty().addListener((ChangeListener<Object>) (observable, oldValue, newValue) -> {
			// Scroll to bottom
			textareaOutput.setScrollTop(Double.MAX_VALUE);
		});
		textareaOutput.setWrapText(true);

		// Program keyboard button handler
		buttonProgramAtmel.setOnAction(event -> {

			// Batch script to run
			ProcessBuilder pb = new ProcessBuilder("data\\programmers\\atmel\\kb_program.bat").redirectErrorStream(true);
			try {
				Process process = pb.start();
				eventBus.post(new LogEvent("Programming attiny1617..."));
				runProcess(process, ProgrammerStatus.ATMEL, buttonProgramAtmel);

			} catch (IOException e) {
				e.printStackTrace();
			}

		});

		// Program bmd-340 button handler
		buttonProgramBMD.setOnAction(event -> {

			// Batch script to run
			ProcessBuilder pb = new ProcessBuilder("data\\programmers\\nrfjprog\\bmd_program.bat").redirectErrorStream(true);
			try {
				Process process = pb.start();
				eventBus.post(new LogEvent("Programming bmd-340..."));
				runProcess(process, ProgrammerStatus.BMD, buttonProgramBMD);

			} catch (IOException e) {
				e.printStackTrace();
			}

		});

		// Fire both the buttons above when clicked
		buttonProgramAll.setOnAction(event -> {
			buttonProgramAtmel.fire();
			buttonProgramBMD.fire();
		});

	}

	/**
	 * Run a programming process
	 * @param process process from ProcessBuilder
	 * @param statusLabel which status label to use for result code
	 * @param button which button to disable while programming
	 */
	private void runProcess(Process process, ProgrammerStatus statusLabel, Button button) {

		eventBus.post(new ProgramButtonEvent(button, true));

		ScheduledExecutorService labelUpdateTimer = Executors.newSingleThreadScheduledExecutor(tf);
		labelUpdateTimer.scheduleWithFixedDelay(() ->
			eventBus.post(new ProgramStatusDancingDotsEvent(statusLabel)), 500, 500, TimeUnit.MILLISECONDS);

		// Run the process in a background thread so the UI doesn't stall
		new Thread(() -> {

			// Wait for the process to finish
			int retval = 1;
			try {
				retval = process.waitFor();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}

			// Stop the marching dots in the label
			labelUpdateTimer.shutdown();
			eventBus.post(new ProgramButtonEvent(button, false));

			// Check if the programming worked out and update the label
			if(retval == 0){
				eventBus.post(new ProgramStatusEvent(statusLabel, "PASS", Color.GREEN));
			}
			else{
				eventBus.post(new ProgramStatusEvent(statusLabel, "FAIL", Color.RED));
			}

			// Get the output and spew it to the log area
			final InputStream is = process.getInputStream();
			BufferedReader reader = new BufferedReader(new InputStreamReader(is));
			try {
				String line;
				while ((line = reader.readLine()) != null) {
					eventBus.post(new LogEvent(line));
				}
			}
			catch (IOException e){
				e.printStackTrace();
			}
			finally {
				try {
					is.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}).start();

	}

	/**
	 * Exit the program.  It's heavy-handed in that it doesn't wait for any processes to finish up cleanly
	 */
	@Subscribe
	public void onEvent(ProgramExitEvent event){
		System.out.println("Exit!");
		Platform.exit();
		System.exit(0);
	}

	/**
	 * Update the appropriate status label
	 */
	@Subscribe
	public void onEvent(ProgramStatusEvent event){

		Platform.runLater(() -> {
			switch (event.getStatusLabel()){
				case ATMEL:
					labelAtmel.setText(event.getStatusString());
					labelAtmel.setTextFill(event.getColor());
					break;
				case BMD:
					labelBMD.setText(event.getStatusString());
					labelBMD.setTextFill(event.getColor());
					break;
			}
		});
	}

	/**
	 * Add a log entry with a timestamp.  Also sent to stdout
	 */
	@Subscribe
	public void onEvent(LogEvent event){

		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
		Date now = new Date();
		String strDate = sdf.format(now);

		String lines[] = event.getLog().split("\\r?\\n");

		Platform.runLater(() -> {
			for(String s : lines) {
				textareaOutput.appendText(strDate.toString() + " - " + s + "\n");
				System.out.println(strDate.toString() + " - " + s);
			}
		});
	}

	int atmelDots = 0;
	int bmdDots = 0;

	/**
	 * Animate some dots after RUN so that the user knows the program has not stalled out
	 */
	@Subscribe
	public void onEvent(ProgramStatusDancingDotsEvent event){

		int dots = 0;

		switch (event.getStatusLabel()){
			case ATMEL:
				atmelDots++;
				if(atmelDots > 3){
					atmelDots = 0;
				}
				dots = atmelDots;
				break;
			case BMD:
				bmdDots++;
				if(bmdDots > 3){
					bmdDots = 0;
				}
				dots = bmdDots;
				break;
		}

		eventBus.post(new ProgramStatusEvent(event.getStatusLabel(), "RUN" + ".".repeat(Math.max(0, dots)), Color.BLACK));
	}

	/**
	 * Set buttons as enabled or disabled.  All button is disabled if either button is disabled
	 */
	@Subscribe
	public void onEvent(ProgramButtonEvent event){

		System.out.println("Button " + event.getButton() + " is set to " + event.isDisable());

		event.getButton().setDisable(event.isDisable());

		// Disable the all button if either of the other ones are still disabled
		buttonProgramAll.setDisable(buttonProgramBMD.isDisable() || buttonProgramAtmel.isDisable());

	}

}
