# Makefile for MyApp SwiftUI Project
# Provides convenient shortcuts for common tasks

.PHONY: help build run clean test install launch logs list boot simulator xcode vim all

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

## help: Show this help message
help:
	@echo ""
	@echo "$(BLUE)MyApp - SwiftUI Counter$(NC)"
	@echo ""
	@echo "$(YELLOW)Available targets:$(NC)"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  $(GREEN)/' | sed 's/:/$(NC):/'
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make run          # Build and run on default simulator"
	@echo "  make clean build  # Clean and build"
	@echo "  make install launch # Install and launch app"
	@echo "  make logs         # View app logs"
	@echo ""

## build: Build the project
build:
	@./build.sh

## run: Build and run the app
run:
	@./build.sh -r

## clean: Clean build artifacts
clean:
	@./build.sh -c

## test: Run tests
test:
	@./build.sh -t

## rebuild: Clean and build
rebuild: clean build

## install: Install app on simulator
install:
	@./simulator.sh install

## launch: Launch app on simulator
launch:
	@./simulator.sh launch

## logs: Show app logs
logs:
	@./simulator.sh logs

## list: List available simulators
list:
	@./simulator.sh list

## boot: Boot the default simulator
boot:
	@./simulator.sh boot

## shutdown: Shutdown the default simulator
shutdown:
	@./simulator.sh shutdown

## reset: Reset the default simulator
reset:
	@./simulator.sh reset

## simulator: Open Simulator app
simulator:
	@./simulator.sh open

## xcode: Open project in Xcode
xcode:
	@open MyApp.xcodeproj

## vim: Open ContentView in Vim
vim:
	@vim MyApp/ContentView.swift

## all: Clean, build, install, and launch
all: clean build install launch
	@echo "$(GREEN)All tasks completed!$(NC)"

## watch: Watch for changes and rebuild (requires fswatch)
watch:
	@if command -v fswatch >/dev/null 2>&1; then \
		echo "$(YELLOW)Watching for changes... (Press Ctrl+C to stop)$(NC)"; \
		fswatch -o MyApp/**/*.swift | xargs -n1 -I{} make build; \
	else \
		echo "$(YELLOW)fswatch not installed. Install with: brew install fswatch$(NC)"; \
		exit 1; \
	fi

## check: Verify all tools are available
check:
	@echo "$(YELLOW)Checking required tools...$(NC)"
	@command -v xcodebuild >/dev/null 2>&1 && echo "$(GREEN)✓ xcodebuild$(NC)" || echo "$(RED)✗ xcodebuild$(NC)"
	@command -v xcrun >/dev/null 2>&1 && echo "$(GREEN)✓ xcrun$(NC)" || echo "$(RED)✗ xcrun$(NC)"
	@command -v simctl >/dev/null 2>&1 && echo "$(GREEN)✓ simctl$(NC)" || echo "$(RED)✗ simctl$(NC)"
	@command -v xcpretty >/dev/null 2>&1 && echo "$(GREEN)✓ xcpretty (optional)$(NC)" || echo "$(YELLOW)○ xcpretty (optional - install with: gem install xcpretty)$(NC)"
	@command -v fswatch >/dev/null 2>&1 && echo "$(GREEN)✓ fswatch (optional)$(NC)" || echo "$(YELLOW)○ fswatch (optional - install with: brew install fswatch)$(NC)"
	@test -f ./build.sh && echo "$(GREEN)✓ build.sh$(NC)" || echo "$(RED)✗ build.sh$(NC)"
	@test -f ./simulator.sh && echo "$(GREEN)✓ simulator.sh$(NC)" || echo "$(RED)✗ simulator.sh$(NC)"

## docs: Open CLI documentation
docs:
	@if command -v mdless >/dev/null 2>&1; then \
		mdless CLI-GUIDE.md; \
	elif command -v bat >/dev/null 2>&1; then \
		bat CLI-GUIDE.md; \
	else \
		less CLI-GUIDE.md; \
	fi
