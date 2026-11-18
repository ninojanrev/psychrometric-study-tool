# Psychrometric Study Tool

An interactive psychrometric chart, state-point calculator, and unit converter for HVAC students. Mobile-first PWA with an installable Android APK.

## Features

- **Carrier-style psychrometric chart** (−10…55 °C, 0…0.033 kg/kg) with dry-bulb, saturation, RH, wet-bulb, enthalpy, and specific-volume line families. Pan, pinch-zoom (down to 1×), double-tap to reset, tap to probe any state point.
- **State-point calculator** — enter any two of dry-bulb, wet-bulb, dew point, RH, humidity ratio, enthalpy, or specific volume; the rest are solved. Altitude or explicit pressure overrides supported.
- **Equation walk-through** — each result shows the formulas used.
- **Unit conversion** — SI ↔ IP across all seven properties, live.
- **Saved points** — long-press the chart to save a state point; tap a chip to jump to it.
- **Offline** — installable PWA (service worker precaches the app); the APK works fully offline out of the box.

## Physics

Property relations follow ASHRAE Fundamentals Handbook Ch. 1: Hyland–Wexler saturation pressure, the ASHRAE eq. 33 wet-bulb approximation, and ideal-gas humidity-ratio relations. Pressure at altitude: 101.325·(1 − 2.25577×10⁻⁵·h)^5.2559, valid −500…10 000 m. Verified against psychrolib.

## Android APK

1. Download the APK from [Releases](../../releases).
2. On the device, allow installing from unknown sources when prompted (the APK is debug-signed; not a Play Store build).
3. Install — the app works offline, no network needed.

## Development

```bash
npm install
npm run dev        # dev server
npm test           # vitest suite
npm run build      # production build to dist/ (includes service worker + icons)
```

### Android build

Requires JDK 17 and an Android SDK (set `sdk.dir` in `android/local.properties`).

```bash
npm run build                    # web assets
npx cap sync android             # copy dist/ + plugins into the Android project
cd android && ./gradlew assembleDebug   # APK at app/build/outputs/apk/debug/
```

Launcher/splash icons are generated from `public/icon.svg`:

```bash
node scripts/gen-android-logo.mjs && npx capacitor-assets generate --android
```
