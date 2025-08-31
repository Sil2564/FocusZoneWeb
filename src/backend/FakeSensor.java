import java.util.Random;

public class FakeSensor {
    private Random random = new Random();

    public boolean isPresent() {
        // Ritorna true o false in modo casuale per simulare la presenza
        return random.nextBoolean();
    }
}
