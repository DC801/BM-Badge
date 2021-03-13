package org.dc801.programmer.service.impl;

import com.google.common.eventbus.EventBus;
import com.google.inject.Inject;
import com.google.inject.Injector;
import javafx.fxml.FXMLLoader;
import javafx.fxml.JavaFXBuilderFactory;
import javafx.scene.Parent;
import org.dc801.programmer.service.FXMLLoaderService;

import java.io.IOException;

public class FXMLLoaderServiceImpl implements FXMLLoaderService {

    private final Injector injector;
    private final EventBus eventBus;

    @Inject
    public FXMLLoaderServiceImpl(final Injector injector, final EventBus eventBus) {
        this.injector = injector;
        this.eventBus = eventBus;
    }

    /**
     * When creating the controller, use Guice to inject dependencies into it first and then register it to the event bus
     * before returning it.
     *
     * @param fxml Path to the FXML
     * @return Node
     */
    @Override
    public Parent load(final String fxml) {
        try {
            return FXMLLoader.load(FXMLLoaderServiceImpl.class.getResource(fxml),
                    null,
                    new JavaFXBuilderFactory(),
                    clazz -> {
                        final Object controller = injector.getInstance(clazz);
                        eventBus.register(controller);
                        return controller;
                    });
        }
        catch (IOException e) {
            throw new RuntimeException("Unable to load FXML from path: " + fxml, e);
        }
    }

}
