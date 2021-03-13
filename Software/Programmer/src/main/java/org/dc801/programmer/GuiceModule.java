package org.dc801.programmer;

import com.google.common.eventbus.EventBus;
import com.google.inject.AbstractModule;
import org.dc801.programmer.service.FXMLLoaderService;
import org.dc801.programmer.service.impl.FXMLLoaderServiceImpl;

/**
 *  Guice dependency injection to inject the eventbus in all the modules
 */
public class GuiceModule extends AbstractModule {

    @Override
    protected void configure() {
        bind(EventBus.class).asEagerSingleton();
        bind(FXMLLoaderService.class).to(FXMLLoaderServiceImpl.class).asEagerSingleton();
    }

}
