# MyApp - SwiftUI Counter

A simple SwiftUI counter app demonstrating basic state management and user interface components.

## Features

- Increment and decrement counter with buttons
- Clean, modern SwiftUI interface
- State management using @State property wrapper

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Getting Started

1. Open `MyApp.xcodeproj` in Xcode
2. Select a simulator or connected device
3. Press `Cmd+R` to build and run

## Project Structure

```
MyApp/
├── MyApp/
│   ├── MyApp.swift          # App entry point
│   └── ContentView.swift    # Main counter view
└── MyApp.xcodeproj/
    └── project.pbxproj      # Xcode project file
```

## Code Overview

### ContentView.swift

The main view contains:
- A `@State` property to track the counter value
- A `Text` view to display the current count
- Two `Button` views for incrementing and decrementing

### MyApp.swift

The app entry point using the `@main` attribute to define the app's lifecycle.

## Building from Command Line

```bash
# Build the project
xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15' build

# Run tests (if available)
xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15'
```

## License

This is a sample project for demonstration purposes.
