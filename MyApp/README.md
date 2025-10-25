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

### Using Xcode (GUI)

1. Open `MyApp.xcodeproj` in Xcode
2. Select a simulator or connected device
3. Press `Cmd+R` to build and run

### Using Command Line (Recommended for CLI Users)

```bash
# Build and run on default simulator
./build.sh -r

# Build and run on specific simulator
./build.sh -s "iPhone 14" -r

# See all options
./build.sh --help
```

**📖 See [CLI-GUIDE.md](CLI-GUIDE.md) for complete command-line documentation**

## Project Structure

```
MyApp/
├── MyApp/
│   ├── MyApp.swift          # App entry point
│   └── ContentView.swift    # Main counter view
├── MyApp.xcodeproj/
│   └── project.pbxproj      # Xcode project file
├── build.sh                 # Build and run script
├── simulator.sh             # Simulator management script
├── .vimrc.local             # Vim configuration
├── CLI-GUIDE.md             # Complete CLI documentation
└── README.md                # This file
```

## Code Overview

### ContentView.swift

The main view contains:
- A `@State` property to track the counter value
- A `Text` view to display the current count
- Two `Button` views for incrementing and decrementing

### MyApp.swift

The app entry point using the `@main` attribute to define the app's lifecycle.

## Command Line Tools

This project includes comprehensive CLI tools for building and managing the app without Xcode.

### Quick Reference

```bash
# Build Scripts
./build.sh              # Build the project
./build.sh -r           # Build and run
./build.sh -c -r        # Clean, build, and run
./build.sh -t           # Run tests
./build.sh -l           # List simulators

# Simulator Management
./simulator.sh list     # List all simulators
./simulator.sh boot     # Boot default simulator
./simulator.sh install  # Install app
./simulator.sh launch   # Launch app
./simulator.sh logs     # View app logs

# Vim Integration
vim MyApp/ContentView.swift
\xr                     # Build and run from Vim
\xb                     # Build from Vim
:XcodeRun               # Build and run command
```

### Advanced Usage

See [CLI-GUIDE.md](CLI-GUIDE.md) for:
- Complete script documentation
- Vim key mappings and commands
- Direct xcodebuild usage
- Tips, tricks, and troubleshooting
- CI/CD integration examples

## License

This is a sample project for demonstration purposes.
