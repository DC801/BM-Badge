package org.dc801.programmer;

import java.util.concurrent.ThreadFactory;

/**
 * Create a new thread in the background
 */
public class DaemonThreadFactory implements ThreadFactory {

    @Override
    public Thread newThread(Runnable r) {
        Thread t = new Thread(r);
        t.setDaemon(true);
        return t;
    }

}
