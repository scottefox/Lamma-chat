#!/bin/bash
# Simulator management script for MyApp

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default simulator
DEFAULT_SIMULATOR="iPhone 15"
SIMULATOR="$DEFAULT_SIMULATOR"

# Help function
show_help() {
    cat << EOF
${BLUE}MyApp Simulator Manager${NC}

Usage: ./simulator.sh [COMMAND] [OPTIONS]

COMMANDS:
    list, ls            List all available simulators
    boot                Boot a simulator
    shutdown            Shutdown a simulator
    reset               Reset a simulator (erase all content)
    open                Open Simulator app
    install             Install MyApp on simulator
    launch              Launch MyApp on simulator
    uninstall           Uninstall MyApp from simulator
    logs                Show simulator logs

OPTIONS:
    -s, --simulator NAME    Specify simulator (default: iPhone 15)
    -h, --help              Show this help message

EXAMPLES:
    ./simulator.sh list                         # List all simulators
    ./simulator.sh boot                         # Boot default simulator
    ./simulator.sh boot -s "iPhone 14"          # Boot iPhone 14
    ./simulator.sh install                      # Install app on default simulator
    ./simulator.sh launch                       # Launch app on default simulator
    ./simulator.sh reset -s "iPhone 15"         # Reset iPhone 15 simulator
    ./simulator.sh logs                         # Show app logs

EOF
}

# Get simulator UUID
get_simulator_uuid() {
    local name="$1"
    xcrun simctl list devices | grep "$name" | grep -E -o -i "([0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12})" | head -1
}

# List simulators
list_simulators() {
    echo -e "${YELLOW}Available iOS Simulators:${NC}\n"
    xcrun simctl list devices available | grep -A 100 "iOS" | grep -E "iPhone|iPad" | sed 's/^/  /'
}

# Boot simulator
boot_simulator() {
    echo -e "${YELLOW}Booting $SIMULATOR...${NC}"
    local uuid=$(get_simulator_uuid "$SIMULATOR")

    if [ -z "$uuid" ]; then
        echo -e "${RED}Simulator '$SIMULATOR' not found${NC}"
        exit 1
    fi

    xcrun simctl boot "$uuid" 2>/dev/null || echo -e "${YELLOW}Simulator already booted${NC}"
    open -a Simulator
    echo -e "${GREEN}Simulator booted successfully${NC}"
}

# Shutdown simulator
shutdown_simulator() {
    echo -e "${YELLOW}Shutting down $SIMULATOR...${NC}"
    local uuid=$(get_simulator_uuid "$SIMULATOR")

    if [ -z "$uuid" ]; then
        echo -e "${RED}Simulator '$SIMULATOR' not found${NC}"
        exit 1
    fi

    xcrun simctl shutdown "$uuid" 2>/dev/null || echo -e "${YELLOW}Simulator already shut down${NC}"
    echo -e "${GREEN}Simulator shut down successfully${NC}"
}

# Reset simulator
reset_simulator() {
    echo -e "${RED}WARNING: This will erase all content and settings on $SIMULATOR${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi

    local uuid=$(get_simulator_uuid "$SIMULATOR")

    if [ -z "$uuid" ]; then
        echo -e "${RED}Simulator '$SIMULATOR' not found${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Resetting $SIMULATOR...${NC}"
    xcrun simctl shutdown "$uuid" 2>/dev/null || true
    xcrun simctl erase "$uuid"
    echo -e "${GREEN}Simulator reset successfully${NC}"
}

# Install app
install_app() {
    echo -e "${YELLOW}Installing MyApp on $SIMULATOR...${NC}"
    local uuid=$(get_simulator_uuid "$SIMULATOR")

    if [ -z "$uuid" ]; then
        echo -e "${RED}Simulator '$SIMULATOR' not found${NC}"
        exit 1
    fi

    # Find the built app
    APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "MyApp.app" -type d 2>/dev/null | head -1)

    if [ -z "$APP_PATH" ]; then
        echo -e "${RED}MyApp.app not found. Build the project first with: ./build.sh${NC}"
        exit 1
    fi

    xcrun simctl boot "$uuid" 2>/dev/null || true
    xcrun simctl install "$uuid" "$APP_PATH"
    echo -e "${GREEN}App installed successfully${NC}"
}

# Launch app
launch_app() {
    echo -e "${YELLOW}Launching MyApp on $SIMULATOR...${NC}"
    local uuid=$(get_simulator_uuid "$SIMULATOR")

    if [ -z "$uuid" ]; then
        echo -e "${RED}Simulator '$SIMULATOR' not found${NC}"
        exit 1
    fi

    xcrun simctl boot "$uuid" 2>/dev/null || true
    open -a Simulator
    xcrun simctl launch "$uuid" com.example.MyApp
    echo -e "${GREEN}App launched successfully${NC}"
}

# Uninstall app
uninstall_app() {
    echo -e "${YELLOW}Uninstalling MyApp from $SIMULATOR...${NC}"
    local uuid=$(get_simulator_uuid "$SIMULATOR")

    if [ -z "$uuid" ]; then
        echo -e "${RED}Simulator '$SIMULATOR' not found${NC}"
        exit 1
    fi

    xcrun simctl uninstall "$uuid" com.example.MyApp
    echo -e "${GREEN}App uninstalled successfully${NC}"
}

# Show logs
show_logs() {
    echo -e "${YELLOW}Showing logs for MyApp on $SIMULATOR...${NC}"
    local uuid=$(get_simulator_uuid "$SIMULATOR")

    if [ -z "$uuid" ]; then
        echo -e "${RED}Simulator '$SIMULATOR' not found${NC}"
        exit 1
    fi

    echo -e "${BLUE}Press Ctrl+C to stop${NC}\n"
    xcrun simctl spawn "$uuid" log stream --predicate 'processImagePath endswith "MyApp"' --level debug
}

# Open Simulator app
open_simulator() {
    echo -e "${YELLOW}Opening Simulator app...${NC}"
    open -a Simulator
}

# Main script
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

COMMAND=""

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
        list|ls)
            COMMAND="list"
            shift
            ;;
        boot)
            COMMAND="boot"
            shift
            ;;
        shutdown)
            COMMAND="shutdown"
            shift
            ;;
        reset)
            COMMAND="reset"
            shift
            ;;
        open)
            COMMAND="open"
            shift
            ;;
        install)
            COMMAND="install"
            shift
            ;;
        launch)
            COMMAND="launch"
            shift
            ;;
        uninstall)
            COMMAND="uninstall"
            shift
            ;;
        logs)
            COMMAND="logs"
            shift
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Execute command
case $COMMAND in
    list)
        list_simulators
        ;;
    boot)
        boot_simulator
        ;;
    shutdown)
        shutdown_simulator
        ;;
    reset)
        reset_simulator
        ;;
    open)
        open_simulator
        ;;
    install)
        install_app
        ;;
    launch)
        launch_app
        ;;
    uninstall)
        uninstall_app
        ;;
    logs)
        show_logs
        ;;
    *)
        show_help
        ;;
esac
