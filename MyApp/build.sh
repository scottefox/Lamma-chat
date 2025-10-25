#!/bin/bash
# Build script for MyApp SwiftUI project

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_FILE="$PROJECT_DIR/MyApp.xcodeproj"
SCHEME="MyApp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
SIMULATOR="iPhone 15"
ACTION="build"
CLEAN=false

# Help function
show_help() {
    cat << EOF
Usage: ./build.sh [OPTIONS]

Build and run the MyApp SwiftUI project from the command line.

OPTIONS:
    -h, --help              Show this help message
    -s, --simulator NAME    Specify simulator (default: iPhone 15)
    -r, --run               Build and run the app
    -t, --test              Run tests
    -c, --clean             Clean build folder before building
    -l, --list              List available simulators
    -d, --devices           List available devices

EXAMPLES:
    ./build.sh                          # Build the project
    ./build.sh -r                       # Build and run on default simulator
    ./build.sh -s "iPhone 14" -r        # Build and run on iPhone 14
    ./build.sh -c -r                    # Clean, build, and run
    ./build.sh -l                       # List available simulators

EOF
}

# List simulators
list_simulators() {
    echo -e "${YELLOW}Available Simulators:${NC}"
    xcrun simctl list devices available | grep -E "iPhone|iPad"
}

# List devices
list_devices() {
    echo -e "${YELLOW}Available Devices:${NC}"
    xcrun xctrace list devices 2>&1 | grep -v "^==" | head -20
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--simulator)
            SIMULATOR="$2"
            shift 2
            ;;
        -r|--run)
            ACTION="run"
            shift
            ;;
        -t|--test)
            ACTION="test"
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -l|--list)
            list_simulators
            exit 0
            ;;
        -d|--devices)
            list_devices
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check if xcpretty is installed
if command -v xcpretty &> /dev/null; then
    FORMATTER="| xcpretty"
else
    FORMATTER=""
    echo -e "${YELLOW}Tip: Install xcpretty for prettier output: gem install xcpretty${NC}"
fi

# Clean if requested
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}Cleaning build folder...${NC}"
    xcodebuild clean -project "$PROJECT_FILE" -scheme "$SCHEME" 2>&1 | grep -E "CLEAN|ERROR|SUCCEEDED" || true
    echo -e "${GREEN}Clean completed${NC}"
fi

# Build destination
DESTINATION="platform=iOS Simulator,name=$SIMULATOR"

# Execute build action
echo -e "${YELLOW}Starting $ACTION for scheme: $SCHEME${NC}"
echo -e "${YELLOW}Destination: $DESTINATION${NC}"

case $ACTION in
    build)
        echo -e "${YELLOW}Building...${NC}"
        if [ -n "$FORMATTER" ]; then
            xcodebuild build \
                -project "$PROJECT_FILE" \
                -scheme "$SCHEME" \
                -destination "$DESTINATION" \
                | xcpretty
        else
            xcodebuild build \
                -project "$PROJECT_FILE" \
                -scheme "$SCHEME" \
                -destination "$DESTINATION"
        fi
        echo -e "${GREEN}Build succeeded!${NC}"
        ;;
    run)
        echo -e "${YELLOW}Building and running...${NC}"
        if [ -n "$FORMATTER" ]; then
            xcodebuild build \
                -project "$PROJECT_FILE" \
                -scheme "$SCHEME" \
                -destination "$DESTINATION" \
                | xcpretty
        else
            xcodebuild build \
                -project "$PROJECT_FILE" \
                -scheme "$SCHEME" \
                -destination "$DESTINATION"
        fi
        echo -e "${GREEN}Build succeeded!${NC}"
        echo -e "${YELLOW}Launching app on simulator...${NC}"

        # Boot simulator if not already running
        xcrun simctl boot "$SIMULATOR" 2>/dev/null || true

        # Open Simulator app
        open -a Simulator

        # Install and launch the app
        APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "MyApp.app" -type d 2>/dev/null | head -1)
        if [ -n "$APP_PATH" ]; then
            SIMULATOR_ID=$(xcrun simctl list devices | grep "$SIMULATOR" | grep -E -o -i "([0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12})" | head -1)
            xcrun simctl install "$SIMULATOR_ID" "$APP_PATH"
            xcrun simctl launch "$SIMULATOR_ID" com.example.MyApp
            echo -e "${GREEN}App launched successfully!${NC}"
        else
            echo -e "${RED}Could not find built app${NC}"
            exit 1
        fi
        ;;
    test)
        echo -e "${YELLOW}Running tests...${NC}"
        if [ -n "$FORMATTER" ]; then
            xcodebuild test \
                -project "$PROJECT_FILE" \
                -scheme "$SCHEME" \
                -destination "$DESTINATION" \
                | xcpretty --test
        else
            xcodebuild test \
                -project "$PROJECT_FILE" \
                -scheme "$SCHEME" \
                -destination "$DESTINATION"
        fi
        echo -e "${GREEN}Tests completed!${NC}"
        ;;
esac
