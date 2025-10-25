# MyApp - Command Line Interface Guide

Complete guide for building, running, and managing the MyApp SwiftUI project from the command line.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Build Script](#build-script)
3. [Simulator Script](#simulator-script)
4. [Vim Integration](#vim-integration)
5. [Direct xcodebuild Commands](#direct-xcodebuild-commands)
6. [Tips and Tricks](#tips-and-tricks)

---

## Quick Start

### Build and Run in One Command

```bash
cd MyApp
./build.sh -r
```

This will build the project and launch it on the default iPhone 15 simulator.

### List Available Simulators

```bash
./build.sh -l
```

### Build for Specific Simulator

```bash
./build.sh -s "iPhone 14" -r
```

---

## Build Script

The `build.sh` script provides a convenient wrapper around `xcodebuild` with helpful options.

### Usage

```bash
./build.sh [OPTIONS]
```

### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-s, --simulator NAME` | Specify target simulator (default: iPhone 15) |
| `-r, --run` | Build and run the app |
| `-t, --test` | Run tests |
| `-c, --clean` | Clean build folder before building |
| `-l, --list` | List available simulators |
| `-d, --devices` | List available physical devices |

### Examples

#### Basic Build

```bash
./build.sh
```

#### Clean Build and Run

```bash
./build.sh -c -r
```

#### Build and Run on iPad

```bash
./build.sh -s "iPad Pro (12.9-inch)" -r
```

#### Run Tests

```bash
./build.sh -t
```

#### Build with xcpretty

Install xcpretty for prettier output:

```bash
gem install xcpretty
./build.sh
```

The script automatically detects and uses xcpretty if available.

---

## Simulator Script

The `simulator.sh` script provides comprehensive simulator management.

### Usage

```bash
./simulator.sh [COMMAND] [OPTIONS]
```

### Commands

| Command | Description |
|---------|-------------|
| `list, ls` | List all available simulators |
| `boot` | Boot a simulator |
| `shutdown` | Shutdown a simulator |
| `reset` | Reset simulator (erase all content) |
| `open` | Open Simulator app |
| `install` | Install MyApp on simulator |
| `launch` | Launch MyApp on simulator |
| `uninstall` | Uninstall MyApp from simulator |
| `logs` | Show simulator logs for MyApp |

### Examples

#### List Simulators

```bash
./simulator.sh list
```

#### Boot Simulator

```bash
# Boot default simulator (iPhone 15)
./simulator.sh boot

# Boot specific simulator
./simulator.sh boot -s "iPhone 14"
```

#### Install and Launch App

```bash
# First build the app
./build.sh

# Install on simulator
./simulator.sh install

# Launch the app
./simulator.sh launch
```

Or do it all at once:

```bash
./build.sh && ./simulator.sh install && ./simulator.sh launch
```

#### View Logs

```bash
./simulator.sh logs
```

Press `Ctrl+C` to stop viewing logs.

#### Reset Simulator

```bash
./simulator.sh reset -s "iPhone 15"
```

This will erase all content and settings (you'll be prompted to confirm).

---

## Vim Integration

A complete Vim configuration is provided in `.vimrc.local`.

### Setup

#### Option 1: Source in your .vimrc

Add to your `~/.vimrc`:

```vim
if filereadable(".vimrc.local")
    source .vimrc.local
endif
```

#### Option 2: Use vim-localvimrc plugin

Install [vim-localvimrc](https://github.com/embear/vim-localvimrc):

```vim
" In your .vimrc
Plug 'embear/vim-localvimrc'
```

The plugin will automatically load `.vimrc.local` when you open files in the MyApp directory.

### Key Mappings

All mappings use `<leader>` (default is `\`):

| Mapping | Action |
|---------|--------|
| `\xb` | Build project |
| `\xr` | Build and run |
| `\xc` | Clean build |
| `\xt` | Run tests |
| `\xl` | List simulators |
| `\xo` | Open in Xcode |
| `\fc` | Open ContentView.swift |
| `\fa` | Open MyApp.swift |

### Vim Commands

| Command | Action |
|---------|--------|
| `:XcodeBuild` | Build the project |
| `:XcodeRun` | Build and run |
| `:XcodeClean` | Clean build folder |
| `:XcodeTest` | Run tests |
| `:XcodeOpen` | Open in Xcode |
| `:make` | Build using build.sh |

### Example Workflow

```vim
" Open project in Vim
$ vim MyApp/ContentView.swift

" Make changes to code...

" Build and run with leader key
\xr

" Or use command
:XcodeRun

" View simulator list
\xl

" Open in Xcode if needed
\xo
```

---

## Direct xcodebuild Commands

For direct control, you can use `xcodebuild` commands.

### Basic Build

```bash
xcodebuild \
    -project MyApp.xcodeproj \
    -scheme MyApp \
    -destination 'platform=iOS Simulator,name=iPhone 15' \
    build
```

### Build and Run

```bash
# Build
xcodebuild \
    -project MyApp.xcodeproj \
    -scheme MyApp \
    -destination 'platform=iOS Simulator,name=iPhone 15' \
    build

# Get simulator UUID
SIMULATOR_ID=$(xcrun simctl list devices | grep "iPhone 15" | grep -E -o -i "([0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12})" | head -1)

# Boot simulator
xcrun simctl boot $SIMULATOR_ID

# Install app
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "MyApp.app" -type d | head -1)
xcrun simctl install $SIMULATOR_ID "$APP_PATH"

# Launch app
xcrun simctl launch $SIMULATOR_ID com.example.MyApp
```

### Clean Build

```bash
xcodebuild clean \
    -project MyApp.xcodeproj \
    -scheme MyApp
```

### Run Tests

```bash
xcodebuild test \
    -project MyApp.xcodeproj \
    -scheme MyApp \
    -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Show Build Settings

```bash
xcodebuild -showBuildSettings \
    -project MyApp.xcodeproj \
    -scheme MyApp
```

### List Schemes

```bash
xcodebuild -list -project MyApp.xcodeproj
```

---

## Tips and Tricks

### 1. Pretty Build Output

Install and use `xcpretty`:

```bash
gem install xcpretty

xcodebuild [...] | xcpretty
```

### 2. Faster Builds

Use parallel builds:

```bash
xcodebuild [...] -parallelizeTargets -jobs 8
```

### 3. Watch for Changes

Use `fswatch` to rebuild on file changes:

```bash
# Install fswatch
brew install fswatch

# Watch Swift files and rebuild
fswatch -o MyApp/**/*.swift | xargs -n1 -I{} ./build.sh
```

### 4. Build on Multiple Simulators

```bash
for sim in "iPhone 15" "iPhone 14" "iPad Pro (12.9-inch)"; do
    echo "Building for $sim..."
    ./build.sh -s "$sim"
done
```

### 5. Clean Derived Data

If builds are acting strange, clean derived data:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### 6. Environment Variables

Set custom build settings:

```bash
export XCODE_XCCONFIG_FILE=./custom.xcconfig
./build.sh
```

### 7. Continuous Integration

Create a CI build script:

```bash
#!/bin/bash
set -e

echo "Cleaning..."
./build.sh -c

echo "Building..."
./build.sh

echo "Running tests..."
./build.sh -t

echo "Build successful!"
```

### 8. Debug Builds

Add debug output:

```bash
xcodebuild [...] -verbose
```

### 9. Archive for Distribution

```bash
xcodebuild archive \
    -project MyApp.xcodeproj \
    -scheme MyApp \
    -archivePath ./build/MyApp.xcarchive
```

### 10. Use Make

Create a `Makefile`:

```makefile
.PHONY: build run clean test

build:
	./build.sh

run:
	./build.sh -r

clean:
	./build.sh -c

test:
	./build.sh -t
```

Then use:

```bash
make run
make test
```

---

## Troubleshooting

### Simulator Won't Boot

```bash
# Kill all simulator processes
killall Simulator

# Reset simulators
xcrun simctl erase all
```

### App Won't Install

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Rebuild
./build.sh -c
```

### Code Signing Issues

For local development:

```bash
# Disable code signing (simulator only)
xcodebuild [...] CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO
```

### Can't Find Simulator

```bash
# List all simulators with UUIDs
xcrun simctl list devices

# Use UUID directly
./build.sh -s "B1C2D3E4-F5A6-B7C8-D9E0-F1A2B3C4D5E6" -r
```

---

## Additional Resources

- [xcodebuild man page](https://developer.apple.com/library/archive/technotes/tn2339/_index.html)
- [simctl documentation](https://nshipster.com/simctl/)
- [SwiftUI documentation](https://developer.apple.com/documentation/swiftui/)
- [Vim Swift plugin](https://github.com/keith/swift.vim)

---

**Happy coding from the command line!** 🚀
