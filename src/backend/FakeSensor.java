package backend;

import java.util.Random;

public class FakeSensor {
    private Random random = new Random();

    public boolean isPresent() {
        
        return random.nextBoolean();
    }
}
