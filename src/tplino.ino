#include <FastLED.h>  // Include Library

// How many leds in your strip?
#define NUM_LEDS __DM_NUMLEDS__

// PINS
#define DATA_PIN __DM_PINDATA__
#define CLOCK_PIN __DM_PINCLK__

// Define the array of leds
CRGB leds[NUM_LEDS];

void setup() {

//FastLED.addLeds<NEOPIXEL,DATA_PIN>(leds, NUM_LEDS);
//FastLED.addLeds<WS2812, DATA_PIN, RGB>(leds, NUM_LEDS);
//FastLED.addLeds<WS2812B, DATA_PIN, RGB>(leds, NUM_LEDS);
//FastLED.addLeds<WS2811, DATA_PIN, RGB>(leds, NUM_LEDS);

//Turn OFF ALL LEDS
for (int i = 0; i < NUM_LEDS; i++) {
leds[i] = CRGB::Black;
}
FastLED.show();
}

__ANIMSFIELD__

void loop() {
__LOOPFIELD__
}